import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth.service';
import { CrmApiService } from '../../../core/crm-api.service';
import { CalendarEventApi, PurchasedCourse } from '../../../core/models';

export type CalendarEventType = 'recordatorio' | 'actividad';

type ValidityUrgency = 'ok' | 'warning' | 'danger' | 'expired';

interface CourseValidityRow {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  diasRestantes: number;
  progressPct: number;
  urgency: ValidityUrgency;
}

interface DayCell {
  date: Date;
  iso: string;
  inCurrentMonth: boolean;
  isToday: boolean;
}

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

@Component({
  selector: 'app-calendar-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar-panel.component.html',
  styleUrl: './calendar-panel.component.css',
})
export class CalendarPanelComponent implements OnInit {
  readonly weekdayLabels = WEEKDAY_LABELS;

  readonly viewDate = signal(this.startOfMonth(new Date()));
  readonly selectedDate = signal(this.toIso(new Date()));
  readonly events = signal<CalendarEventApi[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly saving = signal(false);

  readonly purchasedCourses = signal<PurchasedCourse[]>([]);
  readonly coursesLoading = signal(false);

  // Formulario para crear/editar un evento del día seleccionado.
  readonly editingId = signal<number | null>(null);
  formTitle = '';
  formType: CalendarEventType = 'recordatorio';
  formTime = '';
  formNote = '';

  private userId: number | null = null;

  constructor(private auth: AuthService, private crmApi: CrmApiService) {}

  ngOnInit(): void {
    this.userId = this.auth.currentUser()?.id ?? null;
    this.fetchEvents();
    this.fetchCourseValidity();
  }

  readonly monthLabel = computed(() => {
    const d = this.viewDate();
    return `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
  });

  readonly weeks = computed<DayCell[][]>(() => {
    const first = this.viewDate();
    const year = first.getFullYear();
    const month = first.getMonth();
    const firstWeekday = (first.getDay() + 6) % 7; // 0 = Lunes
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayIso = this.toIso(new Date());

    const cells: DayCell[] = [];

    for (let i = firstWeekday; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      cells.push({ date: d, iso: this.toIso(d), inCurrentMonth: false, isToday: this.toIso(d) === todayIso });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      cells.push({ date: d, iso: this.toIso(d), inCurrentMonth: true, isToday: this.toIso(d) === todayIso });
    }

    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      const d = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
      cells.push({ date: d, iso: this.toIso(d), inCurrentMonth: false, isToday: this.toIso(d) === todayIso });
    }

    const weeks: DayCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  });

  readonly eventsBySelectedDay = computed(() =>
    this.events()
      .filter((e) => e.date === this.selectedDate())
      .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))
  );

  readonly selectedDateLabel = computed(() => {
    const [y, m, d] = this.selectedDate().split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  });

  eventsForDay(iso: string): CalendarEventApi[] {
    return this.events().filter((e) => e.date === iso);
  }

  prevMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    this.fetchEvents();
  }

  nextMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
    this.fetchEvents();
  }

  goToday(): void {
    const today = new Date();
    this.viewDate.set(this.startOfMonth(today));
    this.selectedDate.set(this.toIso(today));
    this.fetchEvents();
  }

  selectDay(cell: DayCell): void {
    this.selectedDate.set(cell.iso);
    if (!cell.inCurrentMonth) {
      this.viewDate.set(this.startOfMonth(cell.date));
      this.fetchEvents();
    }
    this.cancelEdit();
  }

  startNew(): void {
    this.editingId.set(null);
    this.formTitle = '';
    this.formType = 'recordatorio';
    this.formTime = '';
    this.formNote = '';
  }

  editEvent(event: CalendarEventApi): void {
    this.editingId.set(event.id);
    this.formTitle = event.title;
    this.formType = event.type;
    this.formTime = event.time ?? '';
    this.formNote = event.note ?? '';
  }

  cancelEdit(): void {
    this.startNew();
  }

  saveEvent(): void {
    const title = this.formTitle.trim();
    if (!title || !this.userId || this.saving()) return;

    this.saving.set(true);
    const currentId = this.editingId();

    if (currentId) {
      this.crmApi
        .updateCalendarEvent(currentId, this.userId, {
          title,
          type: this.formType,
          time: this.formTime || null,
          note: this.formNote.trim() || null,
        })
        .subscribe({
          next: (updated) => {
            this.events.update((list) => list.map((e) => (e.id === currentId ? updated : e)));
            this.saving.set(false);
            this.cancelEdit();
          },
          error: () => this.saving.set(false),
        });
    } else {
      this.crmApi
        .createCalendarEvent({
          user_id: this.userId,
          date: this.selectedDate(),
          title,
          type: this.formType,
          time: this.formTime || undefined,
          note: this.formNote.trim() || undefined,
        })
        .subscribe({
          next: (created) => {
            this.events.update((list) => [...list, created]);
            this.saving.set(false);
            this.cancelEdit();
          },
          error: () => this.saving.set(false),
        });
    }
  }

  deleteEvent(event: CalendarEventApi): void {
    if (!this.userId) return;
    this.crmApi.deleteCalendarEvent(event.id, this.userId).subscribe({
      next: () => {
        this.events.update((list) => list.filter((e) => e.id !== event.id));
        if (this.editingId() === event.id) {
          this.cancelEdit();
        }
      },
    });
  }

  private fetchEvents(): void {
    if (!this.userId) return;

    const d = this.viewDate();
    // Traemos un rango un poco más ancho que el mes (por los días de
    // relleno de la primera/última semana que pertenecen a otro mes).
    const from = this.toIso(new Date(d.getFullYear(), d.getMonth(), -6));
    const to = this.toIso(new Date(d.getFullYear(), d.getMonth() + 1, 6));

    this.loading.set(true);
    this.loadError.set(false);
    this.crmApi.getCalendarEvents(this.userId, from, to).subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  private fetchCourseValidity(): void {
    if (!this.userId) return;
    this.coursesLoading.set(true);
    this.crmApi.getPurchasedProducts(this.userId).subscribe({
      next: (courses) => {
        this.purchasedCourses.set(courses.filter((c) => c.fecha_inicio && c.fecha_fin));
        this.coursesLoading.set(false);
      },
      error: () => this.coursesLoading.set(false),
    });
  }

  readonly courseValidityRows = computed<CourseValidityRow[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.purchasedCourses().map((c) => {
      const inicio = new Date(c.fecha_inicio + 'T00:00:00');
      const fin = new Date(c.fecha_fin + 'T00:00:00');

      const totalDays = Math.max(1, Math.round((fin.getTime() - inicio.getTime()) / 86400000));
      const elapsedDays = Math.round((today.getTime() - inicio.getTime()) / 86400000);
      const diasRestantes = Math.round((fin.getTime() - today.getTime()) / 86400000);

      const progressPct = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

      let urgency: ValidityUrgency;
      if (diasRestantes < 0) urgency = 'expired';
      else if (diasRestantes <= 7) urgency = 'danger';
      else if (diasRestantes <= 30) urgency = 'warning';
      else urgency = 'ok';

      return {
        nombre: c.nombre,
        fechaInicio: c.fecha_inicio!,
        fechaFin: c.fecha_fin!,
        diasRestantes,
        progressPct,
        urgency,
      };
    });
  });

  formatShortDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  private toIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
