export type GameStatus = 'IDLE' | 'PLAYING' | 'SUCCESS' | 'FAILED';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | 'CUSTOM';

export interface GameConfig {
  duration: number; // in seconds
  wireCount: number; // 12-20
  maxMistakes: number;
  penaltyAmount: number; // duration to remove in seconds on mistake
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}
