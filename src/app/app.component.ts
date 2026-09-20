import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, ChatbotComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'La Profe Chris';

  // Rutas que son "aplicaciones aparte", sin el header/footer/chatbot
  // del landing (el login y el aula virtual tienen su propio diseño).
  private readonly standaloneRoutes = ['/login', '/aula-virtual', '/examen'];

  readonly showMarketingShell = signal(true);

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((event) => {
        const isStandalone = this.standaloneRoutes.some((path) =>
          event.urlAfterRedirects.startsWith(path)
        );
        this.showMarketingShell.set(!isStandalone);
      });
  }
}