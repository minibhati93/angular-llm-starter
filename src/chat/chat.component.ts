import {
  Component, inject, signal, ViewChild, ElementRef,
  AfterViewChecked, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../service/gemini.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements AfterViewChecked, OnInit {

  @ViewChild('messagesEnd') private messagesEnd!: ElementRef;
  @ViewChild('textarea') private textarea!: ElementRef<HTMLTextAreaElement>;

  gemini = inject(GeminiService);

  userInput = signal('');
  modelName = environment.geminiModel;
  apiKeyMissing = signal(false);

  suggestions = [
    'Say hello from Angular and Gemini',
    'Explain this starter project in one paragraph',
    'Give me 3 beginner Angular project ideas',
    'What is the Gemini API in simple terms?',
  ];

  ngOnInit(): void {
    const key = environment.geminiApiKey;
    this.apiKeyMissing.set(!key || key === 'YOUR_GEMINI_API_KEY_HERE');
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  async send(): Promise<void> {
    const text = this.userInput().trim();
    if (!text || this.gemini.isLoading()) return;
    this.userInput.set('');
    this.resetTextarea();
    await this.gemini.sendMessage(text);
  }

  useSuggestion(text: string): void {
    this.userInput.set(text);
    this.send();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  onInput(event: Event): void {
    const ta = event.target as HTMLTextAreaElement;
    this.userInput.set(ta.value);
    this.autoResize(ta);
  }

  clearChat(): void {
    this.gemini.clearHistory();
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }

  private scrollToBottom(): void {
    try {
      this.messagesEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    } catch { /* noop */ }
  }

  private resetTextarea(): void {
    if (this.textarea?.nativeElement) {
      this.textarea.nativeElement.style.height = 'auto';
    }
  }

  private autoResize(el: HTMLTextAreaElement): void {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }
}
