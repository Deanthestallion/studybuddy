import type { Priority } from '@studybuddy/shared';

export interface Subject {
  id: string;
  name: string;
  color: string;
  goals: number;
  completed: number;
  createdAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  subjectId: string | null;
  dueDate: string | null;
  priority: Priority;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  folder: string;
  content: string;
  subjectId: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface DashboardData {
  user: { id: string; name: string; xp: number; level: number; streak: number };
  stats: {
    openAssignments: number;
    notes: number;
    decks: number;
    dueCards: number;
    todayStudyMinutes: number;
  };
  subjects: Array<{
    id: string;
    name: string;
    color: string;
    goals: number;
    completed: number;
    progress: number;
  }>;
  upcoming: Array<Assignment & { subject: { name: string; color: string } | null }>;
}

export interface Analytics {
  range: string;
  studyMinutesByDay: Array<{ date: string; minutes: number }>;
  totals: {
    studyMinutes: number;
    sessions: number;
    assignmentsCompleted: number;
    quizAccuracy: number;
  };
}

export interface Deck {
  id: string;
  title: string;
  subjectId: string | null;
  cardCount: number;
  dueCount: number;
  createdAt: string;
}

export interface StudySession {
  id: string;
  durationSec: number;
  kind: string;
  startedAt: string;
  subject: { name: string; color: string } | null;
}
