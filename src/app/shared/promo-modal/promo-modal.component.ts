import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../core/content.service';

const STORAGE_KEY = 'lpc_promo_dismissed';
const SHOW_DELAY_MS = 2000;

@Component({
  selector: 'app-promo-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './promo-modal.component.html',
  styleUrl: './promo-modal.component.css',
})
export class PromoModalComponent implements OnInit {
  visible = false;

  constructor(public content: ContentService) {}

  ngOnInit(): void {
    const alreadyDismissed = sessionStorage.getItem(STORAGE_KEY);
    if (alreadyDismissed) return;

    setTimeout(() => {
      this.visible = true;
    }, SHOW_DELAY_MS);
  }

  close(): void {
    this.visible = false;
    sessionStorage.setItem(STORAGE_KEY, '1');
  }

  claim(): void {
    const message = encodeURIComponent(
      '¡Hola! Vi la oferta de la clase de francés gratis 🎁 y quiero reservar la mía.'
    );
    window.open(
      `https://wa.me/${this.content.whatsappNumber}?text=${message}`,
      '_blank',
      'noopener'
    );
    this.close();
  }
}