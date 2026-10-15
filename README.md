# Call AI Center

AI receptionist that answers real SMS and phone calls and books appointments.

**No Google account, no Gemini key, no Cloud Run bill.** The AI runs on your own
computer with [Ollama](https://ollama.com) (free), and the app runs as a plain
Node server you start yourself.

## 1. Install

```bash
# Node 20+ required
npm install
cp .env.example .env
```

## 2. Start the free local AI

1. Install Ollama: https://ollama.com/download
2. Download a model (one time):

```bash
ollama pull llama3.2
```

Ollama keeps running in the background on `http://localhost:11434`. That's it —
the defaults in `.env` already point there.

> Prefer a different model? Set `LLM_MODEL` (e.g. `qwen2.5`, `mistral`).
> Want a hosted provider instead? Any OpenAI-compatible API works: set
> `LLM_BASE_URL`, `LLM_MODEL` and `LLM_API_KEY`.

## 3. Run the app

```bash
npm run dev     # development, hot reload
npm start       # production: builds the UI and serves it
```

Open http://localhost:3000. Check http://localhost:3000/api/health — `llm.reachable`
should be `true`. If the model is offline the app still works using built-in
fallback replies.

## 4. Go live with real phone calls & texts (real time)

Twilio needs a public HTTPS URL to reach your computer. Use a free Cloudflare
tunnel (no account needed):

```bash
# install: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
cloudflared tunnel --url http://localhost:3000
```

It prints a URL like `https://something.trycloudflare.com`. In the
[Twilio Console](https://console.twilio.com) → Phone Numbers → your number:

| Setting              | Value (HTTP POST)                                    |
| -------------------- | ---------------------------------------------------- |
| A message comes in   | `https://<your-tunnel>/api/webhooks/twilio/sms`      |
| A call comes in      | `https://<your-tunnel>/api/webhooks/twilio/voice`    |

Now text or call your Twilio number — the AI replies live and remembers the
conversation per caller. Set `HUMAN_FORWARD_NUMBER` in `.env` to transfer
callers who ask for a person.

The only cost is the Twilio phone number itself (about $1.15/month, covered by
Twilio's free trial credit).

## 5. Host it online with Render

Render can't run the local AI, so the app uses Groq's free hosted model instead.

1. Get a free Groq API key at https://console.groq.com/keys.
2. In Render: **New + → Blueprint**, connect this GitHub repo, and click **Apply**.
   `render.yaml` sets the build, start command and settings. Paste your Groq key
   into `LLM_API_KEY` when asked.
3. When the deploy is live, copy your URL (e.g. `https://call-ai-center.onrender.com`)
   and set these on your Twilio number (HTTP POST):
   - A message comes in: `https://YOUR-URL/api/webhooks/twilio/sms`
   - A call comes in: `https://YOUR-URL/api/webhooks/twilio/voice`

> Render's free plan sleeps after 15 minutes with no traffic and takes up to a
> minute to wake, which is longer than Twilio waits. The first call or text after
> a quiet spell can fail. The Starter plan stays awake.

## Endpoints

| Method | Path                                  | Purpose                          |
| ------ | ------------------------------------- | -------------------------------- |
| GET    | `/api/health`                         | Server + AI model status         |
| POST   | `/api/agent/chat`                     | AI reply for the dashboard       |
| POST   | `/api/webhooks/twilio/sms`            | Inbound SMS → AI reply (TwiML)   |
| POST   | `/api/webhooks/twilio/voice`          | Inbound call greeting            |
| POST   | `/api/webhooks/twilio/voice/gather`   | Caller speech → AI spoken reply  |
