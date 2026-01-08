import { Component, OnInit, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { UserNavbarComponent } from '../../components/navbar/navbar.component';
import { UserFooterComponent } from '../../components/footer/footer.component';

interface QuizOption {
  text: string;
  score: number;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
}

interface QuizData {
  quiz: {
    title: string;
    questions: QuizQuestion[];
  };
}

interface QuizResult {
  score: number;
  category: 'Low' | 'Moderate' | 'High';
  message: string;
  description: string;
}

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule, UserNavbarComponent, UserFooterComponent]
})
export class QuizComponent implements OnInit {
  private http = inject(HttpClient);

  questions = signal<QuizQuestion[]>([]);
  currentQuestionIndex = signal(0);
  answers = signal<Map<number, number>>(new Map());
  showResults = signal(false);
  result = signal<QuizResult | null>(null);

  currentQuestion = computed(() => {
    const index = this.currentQuestionIndex();
    const qs = this.questions();
    return qs.length > 0 && index >= 0 && index < qs.length ? qs[index] : null;
  });

  progressPercentage = computed(() => {
    return ((this.currentQuestionIndex() + 1) / this.questions().length) * 100;
  });

  isFirstQuestion = computed(() => this.currentQuestionIndex() === 0);
  isLastQuestion = computed(() => {
    return this.currentQuestionIndex() === this.questions().length - 1;
  });

  allQuestionsAnswered = computed(() => {
    const qs = this.questions();
    const ans = this.answers();
    return qs.length > 0 && qs.every((q) => ans.has(q.id));
  });

  selectedAnswer = computed(() => {
    const currentQ = this.currentQuestion();
    if (!currentQ) return null;
    return this.answers().get(currentQ.id) ?? null;
  });

  ngOnInit(): void {
    this.http.get<QuizData>('/assets/quiz-questions.json').subscribe({
      next: (data) => {
        this.questions.set(data.quiz.questions);
      },
      error: (err) => {
        console.error('Failed to load quiz questions:', err);
      }
    });
  }

  selectAnswer(optionIndex: number): void {
    const currentQ = this.currentQuestion();
    if (!currentQ) return;

    const newAnswers = new Map(this.answers());
    newAnswers.set(currentQ.id, optionIndex);
    this.answers.set(newAnswers);
  }

  nextQuestion(): void {
    const currentIndex = this.currentQuestionIndex();
    if (currentIndex < this.questions().length - 1) {
      this.currentQuestionIndex.set(currentIndex + 1);
    }
  }

  previousQuestion(): void {
    const currentIndex = this.currentQuestionIndex();
    if (currentIndex > 0) {
      this.currentQuestionIndex.set(currentIndex - 1);
    }
  }

  finishQuiz(): void {
    if (!this.allQuestionsAnswered()) return;

    const totalScore = this.calculateTotalScore();
    const result = this.calculateResult(totalScore);
    this.result.set(result);
    this.showResults.set(true);
  }

  private calculateTotalScore(): number {
    let total = 0;
    const qs = this.questions();
    const ans = this.answers();

    qs.forEach((question) => {
      const answerIndex = ans.get(question.id);
      if (answerIndex !== undefined && answerIndex >= 0 && answerIndex < question.options.length) {
        total += question.options[answerIndex].score;
      }
    });

    return total;
  }

  private calculateResult(score: number): QuizResult {
    if (score >= 0 && score <= 10) {
      return {
        score,
        category: 'Low',
        message: "You're doing great!",
        description:
          'Your score indicates a healthy relationship with social media. You have good control over your usage and maintain a balanced digital lifestyle. Keep up the excellent work!'
      };
    } else if (score >= 11 && score <= 20) {
      return {
        score,
        category: 'Moderate',
        message: "You're on the right track!",
        description:
          'Your score indicates a moderate relationship with social media. You have some healthy habits in place, but there\'s room for improvement. With a few adjustments, you can achieve better digital balance and reclaim more time for activities that truly matter to you.'
      };
    } else {
      return {
        score,
        category: 'High',
        message: "It's time to take action!",
        description:
          'Your score suggests that social media may be having a significant impact on your daily life. This is a great opportunity to make positive changes. With the right strategies and support, you can develop healthier digital habits and regain control of your time and attention.'
      };
    }
  }

  restartQuiz(): void {
    this.currentQuestionIndex.set(0);
    this.answers.set(new Map());
    this.showResults.set(false);
    this.result.set(null);
  }
}
