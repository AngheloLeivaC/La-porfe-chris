import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CourseDetailComponent } from './pages/course-detail/course-detail.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'curso/:idioma/:slug', component: CourseDetailComponent },
  { path: '**', redirectTo: '' },
];
