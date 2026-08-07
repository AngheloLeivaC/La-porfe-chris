import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  Renderer2,
} from '@angular/core';

/**
 * Uso: <div appScrollReveal [revealDelay]="100">...</div>
 * Agrega la clase "sr-hidden" al inicio y la quita (agregando "sr-visible")
 * cuando el elemento entra en el viewport, usando IntersectionObserver.
 */
@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  @Input() revealDelay = 0;

  private observer?: IntersectionObserver;

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  ngOnInit(): void {
    const element = this.el.nativeElement;
    this.renderer.addClass(element, 'sr-hidden');
    this.renderer.setStyle(element, 'transition-delay', `${this.revealDelay}ms`);

    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: si no hay soporte, mostrar directamente
      this.renderer.addClass(element, 'sr-visible');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.renderer.addClass(element, 'sr-visible');
            this.observer?.unobserve(element);
          }
        });
      },
      { threshold: 0.15 }
    );

    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
