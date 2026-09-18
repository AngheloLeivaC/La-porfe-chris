import { Course } from '../models';

// Cursos de inglés. Todos son placeholders todavía — reemplaza title,
// text, price, weeks y los 6 módulos por tu contenido real de cada nivel.
function placeholderModules(level: string) {
  return [1, 2, 3, 4, 5, 6].map((n) => ({
    title: `Módulo ${n} — Pendiente`,
    description: `Agrega aquí el contenido real del Módulo ${n} de ${level}.`,
  }));
}

export const englishCourses: Course[] = [
  {
    language: 'ingles',
    slug: 'english-a1',
    level: 'Principiante',
    badgeColor: 'rgba(0,91,178,0.9)',
    title: 'Nombre de tu curso A1',
    price: '$149',
    text: 'Descripción del curso, igual que las de francés.',
    weeks: '12 Semanas',
    img: 'assets/images/ingles-a1.png',
    video: 'assets/videos/curso-a1-preview.mp4',
    certificateText: 'Al completar el nivel A1',
    includes: [
      'Acceso de por vida al contenido A1',
      'Materiales descargables y ejercicios',
      'Comunidad privada de estudiantes',
      'Sesiones de resolución de dudas Q&A',
    ],
    modules: placeholderModules('A1'),
  },
  {
    language: 'ingles',
    slug: 'english-a2',
    level: 'Elemental',
    badgeColor: 'rgba(75,65,225,0.9)',
    title: 'Nombre de tu curso A2',
    price: '$169',
    text: 'Descripción del curso...',
    weeks: '14 Semanas',
    img: 'assets/images/ingles-a2.png',
    video: 'assets/videos/curso-a1-preview.mp4',
    certificateText: 'Al completar el nivel A2',
    includes: [
      'Acceso de por vida al contenido A2',
      'Materiales descargables y ejercicios',
      'Comunidad privada de estudiantes',
      'Sesiones de resolución de dudas Q&A',
    ],
    modules: placeholderModules('A2'),
  },
  {
    language: 'ingles',
    slug: 'english-b1',
    level: 'Intermedio',
    badgeColor: 'rgba(153,65,0,0.9)',
    title: 'Nombre de tu curso B1',
    price: '$199',
    text: 'Descripción del curso...',
    weeks: '16 Semanas',
    img: 'assets/images/ingles-b1.png',
    video: 'assets/videos/curso-a1-preview.mp4',
    certificateText: 'Al completar el nivel B1',
    includes: [
      'Acceso de por vida al contenido B1',
      'Materiales descargables y ejercicios',
      'Comunidad privada de estudiantes',
      'Sesiones de resolución de dudas Q&A',
    ],
    modules: placeholderModules('B1'),
  },
];