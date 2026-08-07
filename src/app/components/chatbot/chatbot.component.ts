import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../core/content.service';
import { ChatOption } from '../../core/models';

interface ChatMessage {
  from: 'bot' | 'user';
  text: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule],
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

  private currentStepId = 'inicio';
  private shouldScroll = false;

  constructor(public content: ContentService) {
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

  restart(): void {
    this.messages = [];
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
    }
  }

  private scrollToBottom(): void {
    try {
      this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    } catch {
      /* noop */
    }
  }
}
