import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../services/lms-data.service';
import { Course, Lesson, QuizQuestion, Certificate } from '../../models/lms.model';
import { CustomAvatarComponent } from '../../components/custom-avatar/custom-avatar.component';

@Component({
  selector: 'app-course-player',
  imports: [CommonModule, RouterModule, FormsModule, CustomAvatarComponent],
  templateUrl: './course-player.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursePlayerComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  lms = inject(LmsDataService);

  courseId = signal<string>('');
  activeLessonId = signal<string>('');
  isSidebarOpen = signal<boolean>(true);
  showCurriculumDrawer = signal<boolean>(false);
  showCertificateModal = signal<boolean>(false);
  earnedCertificate = signal<Certificate | null>(null);

  // Mobile Tabs: 'overview' | 'syllabus' | 'notes' | 'discussion' | 'resources'
  activeMobileTab = signal<'overview' | 'syllabus' | 'notes' | 'discussion' | 'resources'>('overview');

  // Video Player Controls State
  isPlaying = signal<boolean>(false);
  currentPlaybackTime = signal<number>(45); // in seconds
  playbackSpeed = signal<number>(1);
  showSpeedMenu = signal<boolean>(false);
  isCaptionsOn = signal<boolean>(true);
  isAutoplayNext = signal<boolean>(true);

  // Active quiz state
  selectedAnswers = signal<Record<string, number>>({});
  answeredCount = computed(() => Object.keys(this.selectedAnswers()).length);
  quizSubmitted = signal<boolean>(false);
  quizScore = signal<number>(0);
  quizPassed = signal<boolean>(false);

  // Active note-taking scratchpad
  lessonNotes = signal<string>('• Compliance requirements mandate annual recertification.\n• Section 3.2 details standard operating procedures for incident handling.');
  savedNoteAlert = signal<boolean>(false);

  // Community Discussion items
  discussions = signal<Array<{ id: string; user: string; avatar: string; time: string; text: string; likes: number; isLiked?: boolean }>>([
    { id: '1', user: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', time: '2 hours ago', text: 'Can anyone clarify if Module 2 covers European GDPR compliance or just US HIPAA?', likes: 4 },
    { id: '2', user: 'David Kim (Instructor)', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', time: '1 hour ago', text: 'Hi Sarah! Module 2 covers multi-jurisdiction frameworks including both GDPR and ISO 27001.', likes: 8 }
  ]);
  newQuestionText = signal<string>('');

  // Course computed
  course = computed<Course>(() => {
    const id = this.courseId();
    const found = this.lms.courses().find(c => c.id === id);
    return found || this.lms.courses()[0];
  });

  // Current enrollment computed
  enrollment = computed(() => {
    const c = this.course();
    const user = this.lms.activeUser();
    return this.lms.enrollments().find(e => e.courseId === c.id && e.userId === user.id);
  });

  // All lessons flat list
  allLessons = computed<Lesson[]>(() => {
    const list: Lesson[] = [];
    this.course().modules.forEach(m => m.lessons.forEach(l => list.push(l)));
    return list;
  });

  // Active lesson computed
  activeLesson = computed<Lesson>(() => {
    const id = this.activeLessonId();
    const list = this.allLessons();
    const found = list.find(l => l.id === id);
    return found || list[0];
  });

  // Total lesson duration in seconds
  totalDurationSeconds = computed(() => {
    return (this.activeLesson()?.durationMinutes || 10) * 60;
  });

  // Active lesson index
  currentLessonIndex = computed(() => {
    const current = this.activeLesson();
    return this.allLessons().findIndex(l => l.id === current?.id);
  });

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.courseId.set(id);
        const c = this.course();
        const user = this.lms.activeUser();
        
        // Ensure user is enrolled
        this.lms.enrollInCourse(c.id, user.id);

        // Select first lesson or last completed
        const enr = this.enrollment();
        if (enr && enr.lastAccessedLessonId) {
          this.activeLessonId.set(enr.lastAccessedLessonId);
        } else if (c.modules[0]?.lessons[0]) {
          this.activeLessonId.set(c.modules[0].lessons[0].id);
        }
      }
    });

    // Close desktop sidebar on mobile by default
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      this.isSidebarOpen.set(false);
    }
  }

  selectLesson(lessonId: string) {
    this.activeLessonId.set(lessonId);
    this.quizSubmitted.set(false);
    this.selectedAnswers.set({});
    this.isPlaying.set(false);
    this.currentPlaybackTime.set(0);
    this.showCurriculumDrawer.set(false);
  }

  isLessonCompleted(lessonId: string): boolean {
    const enr = this.enrollment();
    return enr ? enr.completedLessonIds.includes(lessonId) : false;
  }

  // Video Player Controls
  togglePlay() {
    this.isPlaying.update(p => !p);
  }

  seekRelative(deltaSeconds: number) {
    const total = this.totalDurationSeconds();
    this.currentPlaybackTime.update(t => Math.max(0, Math.min(total, t + deltaSeconds)));
  }

  setPlaybackSpeed(speed: number) {
    this.playbackSpeed.set(speed);
    this.showSpeedMenu.set(false);
  }

  formatTime(totalSec: number): string {
    const m = Math.floor(totalSec / 60);
    const s = Math.floor(totalSec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // Mark active lesson as completed
  markLessonComplete() {
    const course = this.course();
    const lesson = this.activeLesson();
    const user = this.lms.activeUser();

    this.lms.completeLesson(course.id, lesson.id, user.id);

    // Check if course became 100% complete
    const enr = this.enrollment();
    if (enr && enr.progressPercent === 100) {
      const cert = this.lms.certificates().find(c => c.courseId === course.id && c.userId === user.id);
      if (cert) {
        this.earnedCertificate.set(cert);
        this.showCertificateModal.set(true);
      }
    } else {
      this.goToNextLesson();
    }
  }

  goToNextLesson() {
    const idx = this.currentLessonIndex();
    const all = this.allLessons();
    if (idx < all.length - 1) {
      this.selectLesson(all[idx + 1].id);
    }
  }

  goToPrevLesson() {
    const idx = this.currentLessonIndex();
    const all = this.allLessons();
    if (idx > 0) {
      this.selectLesson(all[idx - 1].id);
    }
  }

  // Notes action
  saveNotes() {
    this.savedNoteAlert.set(true);
    setTimeout(() => this.savedNoteAlert.set(false), 2000);
  }

  // Q&A discussion actions
  postQuestion() {
    const text = this.newQuestionText().trim();
    if (!text) return;

    this.discussions.update(list => [
      {
        id: Date.now().toString(),
        user: this.lms.activeUser().name,
        avatar: this.lms.activeUser().avatar,
        time: 'Just now',
        text,
        likes: 0
      },
      ...list
    ]);
    this.newQuestionText.set('');
  }

  toggleLike(item: { id: string; likes: number; isLiked?: boolean }) {
    this.discussions.update(list => list.map(d => {
      if (d.id === item.id) {
        return {
          ...d,
          isLiked: !d.isLiked,
          likes: d.isLiked ? d.likes - 1 : d.likes + 1
        };
      }
      return d;
    }));
  }

  // Quiz submission
  selectQuizOption(questionId: string, optionIdx: number) {
    if (this.quizSubmitted()) return;
    this.selectedAnswers.update(prev => ({
      ...prev,
      [questionId]: optionIdx
    }));
  }

  submitQuiz(questions: QuizQuestion[], passingScorePercent = 75) {
    let totalPoints = 0;
    let earnedPoints = 0;
    const answers = this.selectedAnswers();

    questions.forEach(q => {
      totalPoints += q.points;
      if (answers[q.id] === q.correctAnswerIndex) {
        earnedPoints += q.points;
      }
    });

    const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 100;
    const passed = scorePercent >= passingScorePercent;

    this.quizScore.set(scorePercent);
    this.quizPassed.set(passed);
    this.quizSubmitted.set(true);

    if (passed) {
      const course = this.course();
      const lesson = this.activeLesson();
      const user = this.lms.activeUser();
      this.lms.completeLesson(course.id, lesson.id, user.id, scorePercent);

      const cert = this.lms.certificates().find(c => c.courseId === course.id && c.userId === user.id);
      if (cert) {
        this.earnedCertificate.set(cert);
      }
    }
  }

  retryQuiz() {
    this.quizSubmitted.set(false);
    this.selectedAnswers.set({});
  }

  viewCertificate() {
    const course = this.course();
    const user = this.lms.activeUser();
    const cert = this.lms.certificates().find(c => c.courseId === course.id && c.userId === user.id);
    if (cert) {
      this.earnedCertificate.set(cert);
      this.showCertificateModal.set(true);
    }
  }

  printCertificate() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  formatCertDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  }
}
