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
  category: 'Low Risk' | 'Medium Risk' | 'High Risk';
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
    
    // Store the user's level for tips filtering
    localStorage.setItem('user_quiz_level', result.category.toLowerCase());
    
    // Scroll to top when showing results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private calculateTotalScore(): number {
    // BUG FIX 1: Changed from summing option scores to counting correct answers
    // Previously: summed scores (0-3 per question) could exceed 10 for high usage
    // Now: counts answers with score 0 or 1 as correct (healthy choices)
    // Result: score is now correctAnswers/totalQuestions (max 10)
    let correctAnswers = 0;
    const qs = this.questions();
    const ans = this.answers();

    qs.forEach((question) => {
      const answerIndex = ans.get(question.id);
      if (answerIndex !== undefined && answerIndex >= 0 && answerIndex < question.options.length) {
        const selectedScore = question.options[answerIndex].score;
        // Consider answers with score 0 or 1 as correct (healthy choices)
        if (selectedScore === 0 || selectedScore === 1) {
          correctAnswers++;
        }
      }
    });

    return correctAnswers;
  }

  private calculateResult(score: number): QuizResult {
    // Score is now correctAnswers out of 10
    // 0–3: High Risk (Needs most help)
    // 4–6: Medium Risk (On the right track)
    // 7–10: Low Risk (Doing great)
    if (score >= 7) {
      return {
        score,
        category: 'Low Risk',
        message: "You're doing great!",
        description:
          'Your score indicates a healthy relationship with social media. You have good control over your usage and maintain a balanced digital lifestyle. Keep up the excellent work!'
      };
    } else if (score >= 4) {
      return {
        score,
        category: 'Medium Risk',
        message: "You're on the right track!",
        description:
          'Your score indicates a moderate relationship with social media. You have some healthy habits in place, but there\'s room for improvement. With a few adjustments, you can achieve better digital balance and reclaim more time for activities that truly matter to you.'
      };
    } else {
      return {
        score,
        category: 'High Risk',
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
    // Clear stored level when restarting quiz
    localStorage.removeItem('user_quiz_level');
  }
}
