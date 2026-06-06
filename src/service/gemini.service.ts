import { Injectable, signal, computed } from '@angular/core';
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  type Content,
  type GenerativeModel,
  type ChatSession,
} from '@google/generative-ai';
import { environment } from '../environments/environment';

type MessageRole = 'user' | 'model';

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
  error?: boolean;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private _state = signal<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });

  readonly messages = computed(() => this._state().messages);
  readonly isLoading = computed(() => this._state().isLoading);
  readonly error = computed(() => this._state().error);
  readonly hasMessages = computed(() => this._state().messages.length > 0);

  private model!: GenerativeModel;
  private chat!: ChatSession;

  constructor() {
    this.initModel();
  }

  private initModel(): void {
    if (!environment.geminiApiKey || environment.geminiApiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      console.error('[GeminiService] API key not set. Edit src/environments/environment.ts');
      return;
    }

    const genAI = new GoogleGenerativeAI(environment.geminiApiKey);

    this.model = genAI.getGenerativeModel({
      model: environment.geminiModel,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      systemInstruction:
        'You are a friendly assistant in an Angular hello world starter app. Keep responses concise and helpful.',
    });

    this.startNewChat();
  }

  async sendMessage(userText: string): Promise<void> {
    if (!this.model) {
      this.setError('API key not configured. See src/environments/environment.ts');
      return;
    }
    if (!userText.trim()) return;

    // Add user message
    this.addMessage({ role: 'user', text: userText });
    this.setLoading(true);
    this.setError(null);

    const streamingId = this.addMessage({ role: 'model', text: '', isStreaming: true });

    try {
      const result = await this.chat.sendMessageStream(userText);

      let fullText = '';

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        this.updateMessage(streamingId, { text: fullText });
      }

      this.updateMessage(streamingId, { isStreaming: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.updateMessage(streamingId, {
        text: `Error: ${msg}`,
        isStreaming: false,
        error: true,
      });
      this.setError(msg);
    } finally {
      this.setLoading(false);
    }
  }

  clearHistory(): void {
    this.startNewChat();
    this._state.set({ messages: [], isLoading: false, error: null });
  }

  private startNewChat(): void {
    if (!this.model) return;
    const history: Content[] = [
      {
        role: 'user',
        parts: [{ text: 'Say hello and mention that this starter is powered by Angular and Gemini.' }],
      },
      {
        role: 'model',
        parts: [{ text: 'Hello! This starter is powered by Angular on the frontend and Gemini for AI responses.' }],
      },
    ];
    this.chat = this.model.startChat({ history });
  }

  private addMessage(partial: Partial<Message> & { role: Message['role']; text: string }): string {
    const id = crypto.randomUUID();
    const message: Message = {
      id,
      timestamp: new Date(),
      ...partial,
    };
    this._state.update(s => ({ ...s, messages: [...s.messages, message] }));
    return id;
  }

  private updateMessage(id: string, patch: Partial<Message>): void {
    this._state.update(s => ({
      ...s,
      messages: s.messages.map(m => m.id === id ? { ...m, ...patch } : m),
    }));
  }

  private setLoading(value: boolean): void {
    this._state.update(s => ({ ...s, isLoading: value }));
  }

  private setError(msg: string | null): void {
    this._state.update(s => ({ ...s, error: msg }));
  }
}
