import { Component } from '@angular/core';
import { HeaderComponent } from './components/header/header.component';
import { HeroComponent } from './components/hero/hero.component';
import { ValuePropsComponent } from './components/value-props/value-props.component';
import { CoursesComponent } from './components/courses/courses.component';
import { AboutMeComponent } from './components/about-me/about-me.component';
import { TestimonialsComponent } from './components/testimonials/testimonials.component';
import { FaqComponent } from './components/faq/faq.component';
import { CtaFinalComponent } from './components/cta-final/cta-final.component';
import { FooterComponent } from './components/footer/footer.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    HeroComponent,
    ValuePropsComponent,
    CoursesComponent,
    AboutMeComponent,
    TestimonialsComponent,
    FaqComponent,
    CtaFinalComponent,
    FooterComponent,
    ChatbotComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'La Profe Chris';
}
