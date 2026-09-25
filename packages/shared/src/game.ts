export type Move = 'ROCK' | 'PAPER' | 'SCISSORS';
export type GameStatus = 'SETTING_UP' | 'CHOOSING' | "FINISHED";
export type GameResult = "TIE" | "PLAYER1_WIN" | "PLAYER2_WIN" | "ERROR";

export interface Player {
  id: string;
  name: string;
  role: number;
  ready: boolean;
  move?: Move;
  score: number;
}

export interface Game {
  id: string;
  idToRole: Map<string, number>;
  players: Player[];
  status: GameStatus;
}
