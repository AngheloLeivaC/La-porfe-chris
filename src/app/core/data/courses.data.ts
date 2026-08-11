import { Course } from '../models';
import { frenchCourses } from './courses.frances';
import { englishCourses } from './courses.ingles';
import { spanishCourses } from './courses.espanol';

export const allCourses: Course[] = [...frenchCourses, ...englishCourses, ...spanishCourses];