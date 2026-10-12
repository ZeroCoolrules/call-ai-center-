import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enable JSON and URL-encoded body parsing (for Twilio webhook form posts)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Server-side Gemini initialization following gemini-api skill instructions
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Health endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    system: 'Agentic Dispatch Host',
    hasGeminiKey: !!apiKey,
    port: PORT,
  });
});

// 2. Server-Side Gemini Chat endpoint for appointment booking
app.post('/api/agent/chat', async (req: Request, res: Response) => {
  try {
    const { message, client, lead, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message text required' });
    }

    if (!ai) {
      // Fallback if no GEMINI_API_KEY is present
      return res.json({
        reply: `Hi! I can help schedule your appointment at ${client?.name || 'our office'}. What day and time are you looking for?`,
        fallback: true,
      });
    }

    const servicesList = client?.services?.map((s: any) => `- ${s.name} ($${s.price}, ${s.durationMinutes} mins)`).join('\n') || 'General consultation';
    const rulesList = client?.rules?.join('\n') || '24h cancellation notice';

    const systemPrompt = `You are an elite, ultra-responsive autonomous AI dispatch receptionist for "${client?.name || 'our business'}".
Business Information:
- Location: ${client?.location || '1420 Biscayne Blvd, Miami, FL'}
- Business Hours: ${client?.businessHours?.startHour || 8}:00 AM to ${client?.businessHours?.endHour || 18}:00 PM
- Services offered:
${servicesList}
- Cancellation policy and rules:
${rulesList}

Lead Details:
- Name: ${lead?.name || 'Customer'}
- Phone: ${lead?.phone || 'Customer Phone'}

Your Goals:
1. Greet warmly and confirm the service requested.
2. Ask for day and time if not yet provided.
3. If they give day and time (e.g. Tuesday at 6pm), confirm availability clearly.
4. If confirming an appointment, format the response concisely:
"Confirmed for [Day, Date, Year] at [Time] for [Duration] minutes. You’ll receive a reminder before the appointment."
5. If the user is angry, frustrated, demanding a human, or asking for legal/lawyer/chargeback, say:
"I understand completely. I am looping in ${client?.hostName || 'our team'} right away to assist you directly."
6. Keep messages friendly, concise, and professional like a real high-end dispatcher.`;

    const conversationContents: any[] = [];
    if (history && Array.isArray(history)) {
      for (const h of history) {
        conversationContents.push({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.text }],
        });
      }
    }
    conversationContents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: conversationContents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
      },
    });

    const reply = response.text || `Confirmed for your requested appointment at ${client?.name}.`;
    const isBookingConfirmed = reply.toLowerCase().includes('confirmed for');

    res.json({
      reply,
      isBookingConfirmed,
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      error: 'Failed to process AI agent response',
      details: error.message,
    });
  }
});

// 3. Twilio Inbound SMS Webhook
// Twilio sends POST with Form URL-encoded: From, To, Body, MessageSid
app.post('/api/webhooks/twilio/sms', async (req: Request, res: Response) => {
  const fromNumber = req.body.From || req.query.From || '+13057894421';
  const toNumber = req.body.To || req.query.To || '+13055550199';
  const bodyText = req.body.Body || req.query.Body || 'Hi, I need an appointment.';

  console.log(`[Twilio SMS Webhook] Inbound from ${fromNumber} to ${toNumber}: "${bodyText}"`);

  // Default agent reply
  let replyText = `Hi, I can help schedule that. What day and time are you looking for?`;
  const lower = String(bodyText).toLowerCase();

  if (lower.includes('stop') || lower.includes('unsubscribe') || lower.includes('cancel')) {
    replyText = `You have successfully been unsubscribed. Reply START at any time to resubscribe.`;
  } else if (lower.includes('tuesday') || lower.includes('july 7') || lower.includes('6pm') || lower.includes('6:00')) {
    replyText = `Confirmed for Tuesday, July 7, 2026 at 6:00 PM for 60 minutes. You’ll receive a reminder before the appointment.`;
  }

  // Return standard TwiML XML
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${replyText}</Message>
</Response>`;

  res.set('Content-Type', 'text/xml');
  res.send(twiml);
});

// 4. Twilio Inbound Voice Webhook
app.post('/api/webhooks/twilio/voice', (req: Request, res: Response) => {
  const fromNumber = req.body.From || 'Unknown';
  console.log(`[Twilio Voice Webhook] Inbound call from ${fromNumber}`);

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Thank you for calling. I am your autonomous AI dispatch agent. Please tell me what service you would like to book.</Say>
    <Gather input="speech" timeout="5" action="/api/webhooks/twilio/voice/gather">
        <Say voice="Polly.Joanna">Listening for your preferred day and time.</Say>
    </Gather>
</Response>`;

  res.set('Content-Type', 'text/xml');
  res.send(twiml);
});

// 5. Mount Vite Middlewares in development mode
async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Agentic Dispatch Host System running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
