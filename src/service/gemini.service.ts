// src/app/services/gemini.service.ts
// Core service that wraps the Google Generative AI SDK

import { Injectable, signal, computed } from '@angular/core';
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  type Content,
  type GenerativeModel,
  type ChatSession,
} from '@google/generative-ai';
import { environment } from '../../environments/environment';
import type { Message, ChatState } from '../models/message.model';

@Injectable({ providedIn: 'root' })
export class GeminiService {

  // ── Signals (reactive state) ──────────────────────────────────────────────
  private _state = signal<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });

  // Public read-only views
  readonly messages   = computed(() => this._state().messages);
  readonly isLoading  = computed(() => this._state().isLoading);
  readonly error      = computed(() => this._state().error);
  readonly hasMessages = computed(() => this._state().messages.length > 0);

  // ── Gemini internals ──────────────────────────────────────────────────────
  private model!: GenerativeModel;
  private chat!: ChatSession;

  constructor() {
    this.initModel();
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  private initModel(): void {
    if (!environment.geminiApiKey || environment.geminiApiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      console.error('[GeminiService] API key not set. Edit src/environments/environment.ts');
      return;
    }

    const genAI = new GoogleGenerativeAI(environment.geminiApiKey);

    this.model = genAI.getGenerativeModel({
      model: environment.geminiModel,
      // Safety settings — adjust as needed for your use case
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
      generationConfig: {
        temperature: 0.9,      // Creativity (0 = deterministic, 2 = very creative)
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      systemInstruction: 'You are a helpful and knowledgeable AI assistant. Be concise, accurate, and friendly.',
    });

    this.startNewChat();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Send a message and stream the response token-by-token.
   */
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

    // Add placeholder for streaming response
    const streamingId = this.addMessage({ role: 'model', text: '', isStreaming: true });

    try {
      const result = await this.chat.sendMessageStream(userText);

      let fullText = '';

      // Stream tokens as they arrive
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        this.updateMessage(streamingId, { text: fullText });
      }

      // Mark streaming complete
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

  /**
   * Clear history and start a fresh conversation.
   */
  clearHistory(): void {
    this.startNewChat();
    this._state.set({ messages: [], isLoading: false, error: null });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private startNewChat(): void {
    if (!this.model) return;
    this.chat = this.model.startChat({ history: [] });
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
