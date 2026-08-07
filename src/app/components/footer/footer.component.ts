import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../core/content.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  readonly legalLinks = ['Política de Privacidad', 'Términos de Servicio', 'Cookies'];
  readonly year = new Date().getFullYear();

  constructor(public content: ContentService) {}
}
