import { Injectable, effect, signal } from '@angular/core';
import { CrmCourseListItem } from './models';

const STORAGE_KEY = 'lpc_cart';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  readonly items = signal<CrmCourseListItem[]>(this.restore());

  constructor() {
    // Guarda el carrito en localStorage cada vez que cambia, para que no
    // se pierda si el alumno recarga la página.
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items()));
    });
  }

  private restore(): CrmCourseListItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  isInCart(courseId: number): boolean {
    return this.items().some((c) => c.id === courseId);
  }

  add(course: CrmCourseListItem): void {
    if (this.isInCart(course.id)) return;
    this.items.update((list) => [...list, course]);
  }

  remove(courseId: number): void {
    this.items.update((list) => list.filter((c) => c.id !== courseId));
  }

  toggle(course: CrmCourseListItem): void {
    if (this.isInCart(course.id)) {
      this.remove(course.id);
    } else {
      this.add(course);
    }
  }

  clear(): void {
    this.items.set([]);
  }

  get count(): number {
    return this.items().length;
  }

  get total(): number {
    return this.items().reduce((sum, c) => sum + Number(c.precio), 0);
  }
}
