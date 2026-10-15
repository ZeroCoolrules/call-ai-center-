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

## 5. Host it online for free (Oracle Cloud)

Run everything — app and AI — on an Oracle Cloud "Always Free" server so your
computer doesn't need to stay on.

1. **Create an account** at https://www.oracle.com/cloud/free/. Oracle asks for a
   card to verify identity; Always Free resources are not charged unless you
   upgrade your account.
2. **Create the server:** Compute → Instances → *Create instance*.
   - Image: **Ubuntu 24.04** (or 22.04)
   - Shape: *Change shape* → **Ampere** → `VM.Standard.A1.Flex`, **4 OCPUs, 24 GB RAM**
     (the "Always Free-eligible" label must show)
   - Download the SSH private key, then *Create*.
   - "Out of capacity"? Try another Availability Domain, or retry later.
3. **Open the web ports:** on the instance page click the **Subnet** →
   **Default Security List** → *Add Ingress Rules*: Source CIDR `0.0.0.0/0`,
   TCP, Destination Port `80,443`.
4. **Connect** (replace with your key file and the instance's Public IP):

   ```bash
   ssh -i path/to/ssh-key.key ubuntu@YOUR_PUBLIC_IP
   ```
5. **Run the setup script** on the server:

   ```bash
   curl -fsSL https://raw.githubusercontent.com/ZeroCoolrules/call-ai-center-/main/deploy/oracle-setup.sh | sudo bash
   ```

   It installs Node.js, Ollama and the AI model, starts the app as a service
   that survives reboots, and sets up free HTTPS at
   `https://<your-ip-with-dashes>.sslip.io` (no domain purchase needed). It asks
   you to choose a dashboard password (username `admin`). At the end it prints
   the two Twilio webhook URLs to paste in.

To update after new code is pushed, run the same command again.
Logs: `sudo journalctl -u call-ai-center -f`.

> Oracle may reclaim Always Free servers that sit nearly idle for a week.
> If that happens, create a new one and re-run the script.

## Endpoints

| Method | Path                                  | Purpose                          |
| ------ | ------------------------------------- | -------------------------------- |
| GET    | `/api/health`                         | Server + AI model status         |
| POST   | `/api/agent/chat`                     | AI reply for the dashboard       |
| POST   | `/api/webhooks/twilio/sms`            | Inbound SMS → AI reply (TwiML)   |
| POST   | `/api/webhooks/twilio/voice`          | Inbound call greeting            |
| POST   | `/api/webhooks/twilio/voice/gather`   | Caller speech → AI spoken reply  |
