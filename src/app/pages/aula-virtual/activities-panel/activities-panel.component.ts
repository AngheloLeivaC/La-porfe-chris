import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth.service';
import { CrmApiService } from '../../../core/crm-api.service';
import { ActivityItem } from '../../../core/models';

@Component({
  selector: 'app-activities-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activities-panel.component.html',
  styleUrl: './activities-panel.component.css',
})
export class ActivitiesPanelComponent implements OnInit {
  readonly activities = signal<ActivityItem[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly togglingIds = signal<Set<number>>(new Set());

  constructor(private auth: AuthService, private crmApi: CrmApiService) {}

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (!user) return;

    this.crmApi.getActivities(user.id).subscribe({
      next: (items) => {
        this.activities.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  isOverdue(item: ActivityItem): boolean {
    return !item.completed && new Date(item.due_date) < new Date();
  }

  dueLabel(item: ActivityItem): string {
    const date = new Date(item.due_date);
    return date.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  isToggling(item: ActivityItem): boolean {
    return this.togglingIds().has(item.id);
  }

  toggleComplete(item: ActivityItem): void {
    if (item.type !== 'tarea') return;
    const user = this.auth.currentUser();
    if (!user) return;

    this.togglingIds.update((set) => new Set(set).add(item.id));

    const request = item.completed
      ? this.crmApi.markTaskIncomplete(item.id, user.id)
      : this.crmApi.markTaskComplete(item.id, user.id);

    request.subscribe({
      next: () => {
        this.activities.update((list) =>
          list.map((a) => (a.id === item.id && a.type === 'tarea' ? { ...a, completed: !a.completed } : a))
        );
        this.finishToggle(item.id);
      },
      error: () => {
        this.finishToggle(item.id);
      },
    });
  }

  private finishToggle(id: number): void {
    this.togglingIds.update((set) => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });
  }
}
