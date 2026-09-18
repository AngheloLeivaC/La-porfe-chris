import { Course } from '../models';

// Cursos de francés. El A1 ya tiene temario real; A2 y B1 tienen la
// estructura de 6 módulos lista, pero con títulos/descripciones que
// necesitan tu contenido real (antes tenían copiado el temario del A1
// por error — ya no).
export const frenchCourses: Course[] = [
  {
    language: 'frances',
    slug: 'toi-moi-la-france-a1',
    level: 'Principiante',
    badgeColor: 'rgba(0,91,178,0.9)',
    title: 'Toi, moi la France A1',
    price: '$149',
    text: 'Ideal para quienes empiezan desde cero. Aprende a presentarte, pedir en un café y sobrevivir en París.',
    weeks: '12 Semanas',
    img: 'assets/images/frances-a1.png',
    video: 'assets/videos/curso-a1-preview.mp4',
    certificateText: 'Al completar el nivel A1',
    includes: [
      'Acceso de por vida al contenido A1',
      'Materiales descargables y ejercicios',
      'Comunidad privada de estudiantes',
      'Sesiones de resolución de dudas Q&A',
    ],
    modules: [
      {
        title: 'Bonjour / Salut / Enchanté de vous rencontrer',
        lessons: [
          '1.1 Introducción',
          '1.2 L\'alphabet en français',
          '1.3 Les pronoms personnels / verbe être et avoir',
          '1.4 Les nationalités et les professions',
          '1.5 Les mois de l\'année, les jours de la semaine',
          '1.6 La famille',
          '1.7 Los articles indéfinis',
          '1.8 Les adjectifs possessifs',
        ],
      },
      {
        title: 'Pourquoi / donc / alors',
        lessons: [
          '2.1 La négation en français',
          '2.2 Les articles définis',
          '2.3 Les mots interrogatifs',
          '2.4 Les partitifs',
          '2.5 Les verbes du premier groupe',
          '2.6 Les prépositions des pays',
        ],
      },
      {
        title: 'Allô / parce que / devoir',
        lessons: [
          '3.1 Les pronoms toniques',
          '3.2 Les verbes du deuxième groupe',
          '3.3 Les nombres en français',
          '3.4 Les conjonctions de coordination',
          '3.5 Le pronom on',
          '3.6 Homophones à et a, et est, ou et où',
        ],
      },
      {
        title: 'Je souhaite / il y a / partir',
        lessons: [
          '4.1 Les verbes auxiliaires',
          '4.2 Les verbes du troisième groupe au présent',
          '4.3 Le futur proche',
          '4.4 Les adjectifs qualificatifs en français',
          '4.5 Les prépositions de lieu',
          '4.6 La liaison en français',
          '4.7 L\'heure en français',
        ],
      },
      {
        title: "Je n'aime pas / combien ça coûte ?",
        lessons: [
          '5.1 Les adverbes de quantité',
          '5.2 Le passé composé avec être',
          '5.3 Le passé composé avec avoir',
          '5.4 Les pronominaux au présent',
          '5.5 Les verbes pronominaux au passé composé',
        ],
      },
      {
        title: "Quel est le prix total / c'est incroyable !",
        lessons: [
          '6.1 La liaison, élision, phonétique',
          '6.2 Le cod en français',
          '6.3 L\'impératif au présent',
          '6.4 Les démonstratifs',
          '6.5 Test',
        ],
      },
    ],
  },
  {
    language: 'frances',
    slug: 'toi-moi-la-france-a2',
    level: 'Elemental',
    badgeColor: 'rgba(75,65,225,0.9)',
    title: 'Toi, moi la France A2',
    price: '$169',
    text: 'Refuerza tus bases y comienza a comunicarte de forma independiente en situaciones cotidianas.',
    weeks: '14 Semanas',
    img: 'assets/images/frances-a2.png',
    video: 'assets/videos/curso-a1-preview.mp4',
    certificateText: 'Al completar el nivel A2',
    includes: [
      'Acceso de por vida al contenido A2',
      'Materiales descargables y ejercicios',
      'Comunidad privada de estudiantes',
      'Sesiones de resolución de dudas Q&A',
    ],
    // 👇 TODO: reemplaza estos 6 módulos por el temario real del nivel A2
    modules: [
      { title: 'Módulo 1 — Pendiente', description: 'Agrega aquí el contenido real del Módulo 1 de A2.' },
      { title: 'Módulo 2 — Pendiente', description: 'Agrega aquí el contenido real del Módulo 2 de A2.' },
      { title: 'Módulo 3 — Pendiente', description: 'Agrega aquí el contenido real del Módulo 3 de A2.' },
      { title: 'Módulo 4 — Pendiente', description: 'Agrega aquí el contenido real del Módulo 4 de A2.' },
      { title: 'Módulo 5 — Pendiente', description: 'Agrega aquí el contenido real del Módulo 5 de A2.' },
      { title: 'Módulo 6 — Pendiente', description: 'Agrega aquí el contenido real del Módulo 6 de A2.' },
    ],
  },
  {
    language: 'frances',
    slug: 'toi-moi-la-france-b1',
    level: 'Intermedio',
    badgeColor: 'rgba(153,65,0,0.9)',
    title: 'Toi, moi la France B1',
    price: '$199',
    text: 'Alcanza la fluidez. Habla sobre tus sueños, opina sobre actualidad y domina los tiempos verbales complejos.',
    weeks: '16 Semanas',
    img: 'assets/images/frances-b1.png',
    video: 'assets/videos/curso-a1-preview.mp4',
    certificateText: 'Al completar el nivel B1',
    includes: [
      'Acceso de por vida al contenido B1',
      'Materiales descargables y ejercicios',
      'Comunidad privada de estudiantes',
      'Sesiones de resolución de dudas Q&A',
    ],
    // 👇 TODO: reemplaza estos 6 módulos por el temario real del nivel B1
    modules: [
      { title: 'Módulo 1 — Pendiente', description: 'Agrega aquí el contenido real del Módulo 1 de B1.' },
      { title: 'Módulo 2 — Pendiente', description: 'Agrega aquí el contenido real del Módulo 2 de B1.' },
      { title: 'Módulo 3 — Pendiente', description: 'Agrega aquí el contenido real del Módulo 3 de B1.' },
      { title: 'Módulo 4 — Pendiente', description: 'Agrega aquí el contenido real del Módulo 4 de B1.' },
      { title: 'Módulo 5 — Pendiente', description: 'Agrega aquí el contenido real del Módulo 5 de B1.' },
      { title: 'Módulo 6 — Pendiente', description: 'Agrega aquí el contenido real del Módulo 6 de B1.' },
    ],
  },
];