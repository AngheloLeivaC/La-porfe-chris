import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/content.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  menuOpen = false;
  scrolled = false;
  activeSection = 'inicio';

  constructor(public content: ContentService) { }

  ngOnInit(): void {
    this.updateActiveSection();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.scrolled = window.scrollY > 60;
    this.updateActiveSection();
  }

  private updateActiveSection(): void {
    const headerOffset = 110;
    let current = '';
    let bestTop = -Infinity;
    for (const link of this.content.navLinks) {
      const el = document.getElementById(link.id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top - headerOffset;
      if (top <= 0 && top > bestTop) {
        bestTop = top;
        current = link.id;
      }
    }
    if (current) {
      this.activeSection = current;
    }
  }
}