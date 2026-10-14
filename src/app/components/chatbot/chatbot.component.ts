import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ContentService } from '../../core/content.service';
import { ChatOption } from '../../core/models';
import { environment } from '../../../environments/environment';

interface ChatMessage {
  from: 'bot' | 'user';
  text: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css',
})
export class ChatbotComponent implements AfterViewChecked {
  @ViewChild('scrollAnchor') private scrollAnchor?: ElementRef<HTMLDivElement>;

  open = false;
  hasNewMessage = true;
  messages: ChatMessage[] = [];
  currentOptions: ChatOption[] = [];
  isTyping = false;

  // Texto que el visitante escribe en el campo libre
  draft = '';

  private currentStepId = 'inicio';
  private shouldScroll = false;
  // Identifica la conversación en n8n (cada visitante tiene su propia memoria)
  private sessionId = crypto.randomUUID();

  constructor(
    public content: ContentService,
    private router: Router,
    private http: HttpClient
  ) {
    this.loadStep(this.currentStepId, false);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  toggleChat(): void {
    this.open = !this.open;
    if (this.open) {
      this.hasNewMessage = false;
      this.shouldScroll = true;
    }
  }

  closeChat(): void {
    this.open = false;
  }

  selectOption(option: ChatOption): void {
    this.messages.push({ from: 'user', text: option.label });
    this.shouldScroll = true;

    if (option.action) {
      this.handleAction(option.action);
      return;
    }

    if (option.next) {
      this.isTyping = true;
      this.currentOptions = [];
      // Pequeño retardo para simular que el bot "está escribiendo"
      setTimeout(() => {
        this.isTyping = false;
        this.loadStep(option.next as string, true);
      }, 500);
    }
  }

  /** Envía el texto libre del visitante al workflow de n8n y muestra la respuesta. */
  sendFree(): void {
    const text = this.draft.trim();
    if (!text || this.isTyping) return;

    this.draft = '';
    this.messages.push({ from: 'user', text });
    this.currentOptions = [];
    this.isTyping = true;
    this.shouldScroll = true;

    this.http
      .post<{ output: string }>(environment.chatWebhookUrl, {
        sessionId: this.sessionId,
        message: text,
      })
      .subscribe({
        next: (res) => {
          this.isTyping = false;
          this.messages.push({ from: 'bot', text: res.output });
          this.currentOptions = [
            { label: '⬅️ Volver al inicio', next: 'inicio' },
          ];
          this.shouldScroll = true;
        },
        error: () => {
          this.isTyping = false;
          this.messages.push({
            from: 'bot',
            text: 'Ups, tuve un problema. Puedes escribirnos por WhatsApp 📲',
          });
          this.currentOptions = [
            { label: '💬 Hablar por WhatsApp', action: 'whatsapp' },
            { label: '⬅️ Volver al inicio', next: 'inicio' },
          ];
          this.shouldScroll = true;
        },
      });
  }

  restart(): void {
    this.messages = [];
    // Nueva sesión = el bot olvida la conversación anterior
    this.sessionId = crypto.randomUUID();
    this.loadStep('inicio', false);
  }

  private handleAction(action: ChatOption['action']): void {
    this.isTyping = true;
    this.currentOptions = [];

    setTimeout(() => {
      this.isTyping = false;

      switch (action) {
        case 'whatsapp': {
          const text = encodeURIComponent(
            '¡Hola! Vengo de la página web y quiero más información sobre los cursos de francés 🇫🇷'
          );
          this.messages.push({
            from: 'bot',
            text: '¡Perfecto! Te llevo a WhatsApp para continuar la conversación con nosotros 📲',
          });
          this.shouldScroll = true;
          window.open(
            `https://wa.me/${this.content.whatsappNumber}?text=${text}`,
            '_blank'
          );
          this.currentOptions = [{ label: '⬅️ Volver al inicio', next: 'inicio' }];
          break;
        }
        case 'scroll-cursos':
          this.messages.push({
            from: 'bot',
            text: 'Aquí tienes nuestros cursos disponibles 👇',
          });
          this.scrollToSection('cursos');
          this.currentOptions = [
            { label: '🎓 Quiero inscribirme', next: 'inscripcion' },
            { label: '⬅️ Volver al inicio', next: 'inicio' },
          ];
          break;
        case 'scroll-inscripcion':
          this.messages.push({
            from: 'bot',
            text: 'Te llevo a la sección de inscripción 👇',
          });
          this.scrollToSection('inscripcion');
          this.currentOptions = [{ label: '⬅️ Volver al inicio', next: 'inicio' }];
          break;
      }
      this.shouldScroll = true;
    }, 400);
  }

  private loadStep(stepId: string, pushMessage: boolean): void {
    const step = this.content.chatFlow[stepId];
    if (!step) return;
    this.currentStepId = stepId;
    if (pushMessage) {
      this.messages.push({ from: 'bot', text: step.bot });
    } else if (this.messages.length === 0) {
      this.messages.push({ from: 'bot', text: step.bot });
    }
    this.currentOptions = step.options;
    this.shouldScroll = true;
  }

  private scrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    this.router.navigate(['/'], { fragment: id });
  }

  private scrollToBottom(): void {
    try {
      this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    } catch {
      /* noop */
    }
  }
}