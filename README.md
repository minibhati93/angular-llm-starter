# Angular Gemini Hello World

A small starter project that connects an Angular app to Google's Gemini API and streams responses into a simple chat UI.

## What this starter includes

- Angular standalone components
- A `GeminiService` wrapping `@google/generative-ai`
- Streaming model responses
- A simple "hello world" style prompt UI
- Environment-based Gemini model and API key config

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Add your Gemini API key in [src/environments/environment.ts](/Users/minibhati/Desktop/personal/angular-llm-starter/src/environments/environment.ts):

```ts
export const environment = {
  production: false,
  geminiApiKey: 'YOUR_GEMINI_API_KEY_HERE',
  geminiModel: 'gemini-2.5-flash',
};
```

3. Start the app:

```bash
npm start
```

4. Open `http://localhost:4200`

## Main files

- [src/app/app.html](/Users/minibhati/Desktop/personal/angular-llm-starter/src/app/app.html) mounts the starter UI
- [src/chat/chat.component.ts](/Users/minibhati/Desktop/personal/angular-llm-starter/src/chat/chat.component.ts) handles user input and view behavior
- [src/chat/chat.component.html](/Users/minibhati/Desktop/personal/angular-llm-starter/src/chat/chat.component.html) renders the starter layout
- [src/service/gemini.service.ts](/Users/minibhati/Desktop/personal/angular-llm-starter/src/service/gemini.service.ts) manages Gemini chat state and streaming

## Notes

- This is fine for local development, but a production app should call Gemini from a backend so the API key is not exposed in the browser.
- The UI shows a warning until you replace the placeholder API key.
