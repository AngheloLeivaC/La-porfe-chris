import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CrmApiService } from '../../core/crm-api.service';
import { ContentService } from '../../core/content.service';
import { ExamDataResponse, ExamQuestionApi } from '../../core/models';

/** Valor "infinito" que usa el backend para marcar un examen sin límite de tiempo. */
const NO_TIME_LIMIT_SENTINEL = 59999940;

type QuestionAnswer = number | number[] | string | null;

type StepStatus = null | 'correct' | 'incorrect';

type ResultView =
  | { kind: 'waiting' }
  | { kind: 'graded'; approved: boolean; rate: number; minPassingScore: number; correctCount: number; incorrectCount: number };

@Component({
  selector: 'app-exam-runner',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './exam-runner.component.html',
  styleUrl: './exam-runner.component.css',
})
export class ExamRunnerComponent implements OnInit, OnDestroy {
  readonly loading = signal(true);
  readonly loadError = signal(false);

  readonly examData = signal<ExamDataResponse | null>(null);
  readonly started = signal(false);
  readonly currentIndex = signal(0);
  readonly answers = signal<QuestionAnswer[]>([]);
  readonly stepStatus = signal<StepStatus[]>([]);
  readonly submitting = signal(false);
  readonly result = signal<ResultView | null>(null);

  readonly secondsLeft = signal(0);
  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private startedAtSeconds = 0;

  private examId!: number;
  private courseId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private crmApi: CrmApiService,
    public content: ContentService
  ) {}

  ngOnInit(): void {
    this.examId = Number(this.route.snapshot.paramMap.get('examId'));
    const courseIdParam = this.route.snapshot.queryParamMap.get('courseId');
    this.courseId = courseIdParam ? Number(courseIdParam) : null;

    this.crmApi.getExam(this.examId).subscribe({
      next: (resp) => {
        if (resp.status !== 200 || !resp.data?.exam) {
          this.loadError.set(true);
          this.loading.set(false);
          return;
        }
        this.examData.set(resp.data);
        this.answers.set(resp.data.questions.map((q) => this.emptyAnswerFor(q)));
        this.stepStatus.set(resp.data.questions.map(() => null));
        this.loading.set(false);

        // Si no tenemos el course_id por query param (llegaron acá directo), lo pedimos.
        if (this.courseId === null) {
          this.crmApi.getCourseIdForExam(this.examId).subscribe({
            next: (id) => (this.courseId = Number(id)),
            error: () => {}, // el envío final validará que exista
          });
        }
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  readonly hasTimeLimit = computed(() => {
    const time = this.examData()?.exam?.time;
    return !!time && time !== NO_TIME_LIMIT_SENTINEL;
  });

  readonly totalQuestions = computed(() => this.examData()?.questions.length ?? 0);

  readonly currentQuestion = computed<ExamQuestionApi | null>(() => {
    const data = this.examData();
    if (!data) return null;
    return data.questions[this.currentIndex()] ?? null;
  });

  readonly isLastQuestion = computed(() => this.currentIndex() === this.totalQuestions() - 1);

  readonly currentAnswer = computed(() => this.answers()[this.currentIndex()]);

  readonly canAdvance = computed(() => {
    const answer = this.currentAnswer();
    if (answer === null) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    if (typeof answer === 'string') return answer.trim().length > 0;
    return true;
  });

  readonly timeLabel = computed(() => {
    const s = this.secondsLeft();
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
  });

  startExam(): void {
    const exam = this.examData()?.exam;
    if (!exam) return;

    this.startedAtSeconds = Math.floor(Date.now() / 1000);

    if (this.hasTimeLimit() && exam.time) {
      this.secondsLeft.set(exam.time);
      this.timerHandle = setInterval(() => {
        this.secondsLeft.update((s) => {
          if (s <= 1) {
            this.clearTimer();
            this.submitAnswers();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }

    this.started.set(true);
  }

  selectSingle(optionIndex: number): void {
    const idx = this.currentIndex();
    this.answers.update((list) => {
      const copy = [...list];
      copy[idx] = optionIndex;
      return copy;
    });
  }

  toggleMultiple(optionIndex: number): void {
    const idx = this.currentIndex();
    this.answers.update((list) => {
      const copy = [...list];
      const current = Array.isArray(copy[idx]) ? [...(copy[idx] as number[])] : [];
      const pos = current.indexOf(optionIndex);
      if (pos >= 0) current.splice(pos, 1);
      else current.push(optionIndex);
      copy[idx] = current;
      return copy;
    });
  }

  setOpenAnswer(value: string): void {
    const idx = this.currentIndex();
    this.answers.update((list) => {
      const copy = [...list];
      copy[idx] = value;
      return copy;
    });
  }

  isSelected(optionIndex: number): boolean {
    const answer = this.currentAnswer();
    if (Array.isArray(answer)) return answer.includes(optionIndex);
    return answer === optionIndex;
  }

  goNext(): void {
    if (!this.canAdvance()) return;

    // Indicador visual (solo referencial, la nota real la calcula el backend).
    this.stepStatus.update((list) => {
      const copy = [...list];
      copy[this.currentIndex()] = this.checkLocally(this.currentQuestion(), this.currentAnswer());
      return copy;
    });

    if (this.isLastQuestion()) {
      this.submitAnswers();
    } else {
      this.currentIndex.update((i) => i + 1);
    }
  }

  goPrev(): void {
    if (this.currentIndex() > 0) {
      this.currentIndex.update((i) => i - 1);
    }
  }

  goToStep(index: number): void {
    // Solo se puede saltar a preguntas ya respondidas, o a la actual/siguiente inmediata.
    if (index <= this.currentIndex() || this.isAnswered(index - 1)) {
      this.currentIndex.set(index);
    }
  }

  private isAnswered(index: number): boolean {
    const answer = this.answers()[index];
    if (answer === null || answer === undefined) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    if (typeof answer === 'string') return answer.trim().length > 0;
    return true;
  }

  submitAnswers(): void {
    if (this.submitting()) return;
    const data = this.examData();
    if (!data) return;

    this.clearTimer();
    this.submitting.set(true);

    const secondsUsed = Math.max(0, Math.floor(Date.now() / 1000) - this.startedAtSeconds);
    const payload = {
      id_exam: this.examId,
      answers: this.answers().map((option) => ({ option: option ?? '' })),
      course_id: this.courseId ?? 0,
      seconds_used: secondsUsed,
    };

    this.crmApi.submitExamAnswers(payload).subscribe({
      next: (resp) => {
        this.submitting.set(false);
        this.applyResult(resp, data);
      },
      error: () => {
        this.submitting.set(false);
        this.loadError.set(true);
      },
    });
  }

  private applyResult(resp: any, data: ExamDataResponse): void {
    if (resp === 'Waiting') {
      this.result.set({ kind: 'waiting' });
      return;
    }

    const stepStatuses = this.stepStatus();
    const correctCount = stepStatuses.filter((s) => s === 'correct').length;
    const incorrectCount = stepStatuses.filter((s) => s === 'incorrect').length;

    const minScore = data.exam.min_passing_score;
    let rate: number = resp?.rate ?? 0;
    let approved: boolean;

    if (resp?.message === 'Aprobado' || resp?.message === 'Desaprobado') {
      approved = resp.message === 'Aprobado';
    } else {
      // Camino sin 'message' explícito (examen sin timer, ver backend): lo resolvemos con la nota.
      approved = rate >= minScore;
    }

    this.result.set({ kind: 'graded', approved, rate, minPassingScore: minScore, correctCount, incorrectCount });
  }

  backToExams(): void {
    this.router.navigate(['/aula-virtual']);
  }

  private checkLocally(question: ExamQuestionApi | null, answer: QuestionAnswer): StepStatus {
    if (!question || answer === null) return null;
    if (question.question_type_id === 4) return null; // abierta: no hay "correcto" local

    if (question.question_type_id === 2) {
      const correctSet = String(question.correct)
        .split(',')
        .map((v) => Number(v.trim()))
        .sort();
      const givenSet = (Array.isArray(answer) ? answer : []).slice().sort();
      const isEqual = correctSet.length === givenSet.length && correctSet.every((v, i) => v === givenSet[i]);
      return isEqual ? 'correct' : 'incorrect';
    }

    // Tipo 1 (simple) y 3 (binaria)
    // eslint-disable-next-line eqeqeq
    return question.correct == String(answer) || Number(question.correct) === answer ? 'correct' : 'incorrect';
  }

  private emptyAnswerFor(question: ExamQuestionApi): QuestionAnswer {
    if (question.question_type_id === 2) return [];
    if (question.question_type_id === 4) return '';
    return null;
  }

  private clearTimer(): void {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }
}
