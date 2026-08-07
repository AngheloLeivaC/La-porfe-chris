import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../core/content.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent {
  constructor(public content: ContentService) {}
}