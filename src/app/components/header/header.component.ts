import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../core/content.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  menuOpen = false;
  scrolled = false;

  constructor(public content: ContentService) {}

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.scrolled = window.scrollY > 60;
  }
}