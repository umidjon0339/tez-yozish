export interface StageIntro {
  type: 'intro';
  targetKey: string;
  prompt: string;
}

export interface StagePractice {
  type: 'practice';
  content: string;
}

export type Stage = StageIntro | StagePractice;

export interface Lesson {
  id: string | number;
  title: string;
  subtitle: string;
  difficulty: string;
  estimatedMinutes: number;
  stages: Stage[];
}
