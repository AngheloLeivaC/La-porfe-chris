import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CourseDetailComponent } from './pages/course-detail/course-detail.component';
import { LoginComponent } from './pages/login/login.component';
import { RecoverPasswordComponent } from './pages/recover-password/recover-password.component';
import { AulaVirtualComponent } from './pages/aula-virtual/aula-virtual.component';
import { ExamRunnerComponent } from './pages/exam-runner/exam-runner.component';
import { CoursePlayerComponent } from './pages/course-player/course-player.component';
import { authGuard } from './core/auth.guard';

/**
 * /aula-virtual/curso/:productSlug            → retoma la última clase empezada
 * /aula-virtual/curso/:productSlug/:classSlug → una clase concreta
 * Con un solo matcher las dos URL usan la misma ruta, así que al cambiar de clase
 * Angular reutiliza el componente (no recarga el curso ni reinicia el video).
 */
export function coursePlayerMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (
    segments.length >= 3 &&
    segments.length <= 4 &&
    segments[0].path === 'aula-virtual' &&
    segments[1].path === 'curso'
  ) {
    const posParams: { [name: string]: UrlSegment } = { productSlug: segments[2] };
    if (segments[3]) posParams['classSlug'] = segments[3];
    return { consumed: segments, posParams };
  }
  return null;
}

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'curso/:idioma/:slug', component: CourseDetailComponent },
  { path: 'login', component: LoginComponent },
  { path: 'recuperar-contrasena', component: RecoverPasswordComponent },
  { matcher: coursePlayerMatcher, component: CoursePlayerComponent, canActivate: [authGuard] },
  { path: 'aula-virtual', component: AulaVirtualComponent, canActivate: [authGuard] },
  { path: 'examen/:examId', component: ExamRunnerComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
