import type { Answers, Need, NextQuestion, Scheme } from '@/engine/types';
import type { Ranked, Weights } from '@/engine/rank';
import type { Skip } from '@/engine/nextQuestion';

/** Request and response types are identical for the local and http adapters. */
export interface ScreenRequest {
  answers: Answers;
  needs?: Need[];
  weights?: Weights;
}
export interface ScreenResponse {
  results: Ranked[];
}

export interface NextRequest {
  answers: Answers;
}
export interface NextResponse {
  question: NextQuestion | null;
  /** Estimated questions left, including this one. */
  remaining: number;
  skips: Skip[];
}

export interface SchemeApi {
  readonly mode: 'local' | 'http';
  listSchemes(): Promise<Scheme[]>;
  getScheme(id: string): Promise<Scheme | null>;
  screen(req: ScreenRequest): Promise<ScreenResponse>;
  next(req: NextRequest): Promise<NextResponse>;
}
