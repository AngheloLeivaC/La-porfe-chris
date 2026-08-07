import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../core/content.service';
import { ScrollRevealDirective } from '../../shared/scroll-reveal.directive';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, ScrollRevealDirective],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css',
})
export class FaqComponent {
  openIndex: number | null = null;

  constructor(public content: ContentService) {}

  toggle(i: number): void {
    this.openIndex = this.openIndex === i ? null : i;
  }
}
