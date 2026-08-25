import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CourseDetailComponent } from './pages/course-detail/course-detail.component';
import { LoginComponent } from './pages/login/login.component';
import { AulaVirtualComponent } from './pages/aula-virtual/aula-virtual.component';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'curso/:idioma/:slug', component: CourseDetailComponent },
  { path: 'login', component: LoginComponent },
  { path: 'aula-virtual', component: AulaVirtualComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
