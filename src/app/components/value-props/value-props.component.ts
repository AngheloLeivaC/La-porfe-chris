import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../core/content.service';
import { ScrollRevealDirective } from '../../shared/scroll-reveal.directive';

@Component({
  selector: 'app-value-props',
  standalone: true,
  imports: [CommonModule, ScrollRevealDirective],
  templateUrl: './value-props.component.html',
  styleUrl: './value-props.component.css',
})
export class ValuePropsComponent {
  constructor(public content: ContentService) {}
}
