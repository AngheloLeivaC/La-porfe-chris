import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../core/content.service';
import { ScrollRevealDirective } from '../../shared/scroll-reveal.directive';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule, ScrollRevealDirective],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.css',
})
export class TestimonialsComponent {
  readonly stars = [1, 2, 3, 4, 5];

  constructor(public content: ContentService) {}
}
