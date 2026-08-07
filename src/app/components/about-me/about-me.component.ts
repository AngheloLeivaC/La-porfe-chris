import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../core/content.service';
import { ScrollRevealDirective } from '../../shared/scroll-reveal.directive';

@Component({
  selector: 'app-about-me',
  standalone: true,
  imports: [CommonModule, ScrollRevealDirective],
  templateUrl: './about-me.component.html',
  styleUrl: './about-me.component.css',
})
export class AboutMeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('introVideo') introVideoRef?: ElementRef<HTMLVideoElement>;

  isMuted = true;

  private observer?: IntersectionObserver;

  constructor(public content: ContentService) {}

  ngAfterViewInit(): void {
    const video = this.introVideoRef?.nativeElement;
    if (!video || typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Los navegadores exigen que el video esté en silencio para
            // poder reproducirse automáticamente sin interacción del usuario.
            video.muted = true;
            this.isMuted = true;
            video.play().catch(() => {
              /* Si el navegador bloquea el autoplay, no hacemos nada:
                 el usuario siempre puede darle play con los controles nativos. */
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    this.observer.observe(video);
  }

  toggleSound(): void {
    const video = this.introVideoRef?.nativeElement;
    if (!video) return;
    video.muted = !video.muted;
    this.isMuted = video.muted;
  }

  /** Acción del botón "Escucha mi historia": alterna el sonido del video
   *  (antes siempre forzaba play + sonido, sin importar el estado actual,
   *  así que un segundo clic no silenciaba nada). */
  playIntroStory(): void {
    const video = this.introVideoRef?.nativeElement;
    if (!video) return;

    if (video.muted) {
      video.muted = false;
      this.isMuted = false;
      video.play().catch(() => {
        /* Si el navegador bloquea el play programático, el usuario puede
           usar los controles nativos del video. */
      });
      video.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      video.muted = true;
      this.isMuted = true;
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
