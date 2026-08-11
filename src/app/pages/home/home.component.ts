import { Component } from '@angular/core';
import { HeroComponent } from '../../components/hero/hero.component';
import { ValuePropsComponent } from '../../components/value-props/value-props.component';
import { CoursesComponent } from '../../components/courses/courses.component';
import { AboutMeComponent } from '../../components/about-me/about-me.component';
import { TestimonialsComponent } from '../../components/testimonials/testimonials.component';
import { FaqComponent } from '../../components/faq/faq.component';
import { CtaFinalComponent } from '../../components/cta-final/cta-final.component';

// Página de inicio: agrupa todas las secciones que antes vivían directo en
// AppComponent. Al existir como su propia ruta ('/'), el router puede
// mostrar otras páginas (como el detalle de un curso) sin duplicar el
// header/footer/chatbot, que se quedan en AppComponent envolviendo el
// <router-outlet>.
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroComponent,
    ValuePropsComponent,
    CoursesComponent,
    AboutMeComponent,
    TestimonialsComponent,
    FaqComponent,
    CtaFinalComponent,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent {}
