# Angular Gemini Starter 🤖

A production-grade Angular 18 chat app powered by Google Gemini — **completely free** using the Gemini API free tier. No credit card required.

## Free Tier Summary (as of May 2026)

| Model | RPM | RPD | Notes |
|-------|-----|-----|-------|
| `gemini-2.5-flash` | 10 | 250 | ✅ Default — best balance |
| `gemini-2.5-flash-lite` | 15 | 1,000 | Best for high volume |
| `gemini-2.5-pro` | 5 | 100 | Most capable, lowest quota |

> ⚠️ As of April 2026, Pro models (3.x series) are **paid only**. Flash and Flash-Lite remain free.

---

## Quickstart

### 1. Get a FREE Gemini API Key

1. Go to **[aistudio.google.com](https://aistudio.google.com)**
2. Sign in with your Google account
3. Click **"Get API key"** → **"Create API key"**
4. No credit card required ✅

### 2. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/angular-gemini-starter.git
cd angular-gemini-starter
npm install
```

### 3. Add Your Key

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  geminiApiKey: 'AIza...',         // ← paste your key here
  geminiModel: 'gemini-2.5-flash', // free tier model
};
```

> 🔐 **Security:** Never commit real keys. For CI/CD, inject via environment variables and use a backend proxy.

### 4. Run

```bash
npm start
# → http://localhost:4200
```

---

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   └── chat/
│   │       ├── chat.component.ts    ← UI logic (signals, events)
│   │       ├── chat.component.html  ← Template (Angular 17+ control flow)
│   │       └── chat.component.scss  ← Styles
│   ├── services/
│   │   ├── gemini.service.ts        ← Core LLM wrapper (streaming + signals)
│   │   └── gemini.service.spec.ts   ← Unit tests
│   ├── models/
│   │   └── message.model.ts         ← TypeScript interfaces
│   ├── app.component.ts
│   └── app.config.ts
├── environments/
│   ├── environment.ts               ← Dev (add your key here)
│   └── environment.prod.ts          ← Prod (inject via CI)
└── styles.scss
```

---

## Key Concepts

### Angular Signals (Angular 17+)

This project uses the modern **signals** API instead of RxJS Observables for state management:

```typescript
// In service
private _state = signal<ChatState>({ messages: [], isLoading: false, error: null });
readonly messages = computed(() => this._state().messages);

// In template — automatically reactive
{{ gemini.isLoading() }}
```

### Streaming Responses

The Gemini SDK supports streaming. Tokens appear as they're generated:

```typescript
const result = await this.chat.sendMessageStream(userText);

for await (const chunk of result.stream) {
  fullText += chunk.text();
  this.updateMessage(streamingId, { text: fullText });
}
```

### Conversation History

Gemini's `startChat()` automatically maintains history internally:

```typescript
this.chat = this.model.startChat({ history: [] });
// Each sendMessageStream() call builds on the previous ones
```

---

## Dev Tools

| Tool | Purpose |
|------|---------|
| **Angular CLI** (`ng`) | Scaffold, build, serve, test |
| **Google AI Studio** | Test prompts in browser before coding |
| **Angular DevTools** (Chrome ext) | Inspect signals, component tree |
| **Karma + Jasmine** | Unit tests (`npm test`) |
| **Chrome DevTools Network tab** | Inspect Gemini API requests |
| **ESLint** | Code quality (`ng lint`) |

---

## Switching Models

Edit `src/environments/environment.ts`:

```typescript
geminiModel: 'gemini-2.5-flash-lite',  // Higher daily quota (1000 RPD)
geminiModel: 'gemini-2.5-flash',        // Default (250 RPD)
geminiModel: 'gemini-2.5-pro',          // Most capable (100 RPD)
```

---

## Production Notes

1. **Never expose API keys in the frontend** for production. Use a backend proxy (Node.js/Express, Firebase Functions, etc.) that calls Gemini server-side.
2. Handle **rate limit errors** (HTTP 429) with exponential backoff.
3. Add **caching** for repeated queries to preserve daily quota.
4. Consider **Gemini Flash-Lite** for high-volume or automated workflows.

---

## License

MIT
