export type Move = 'ROCK' | 'PAPER' | 'SCISSORS';
export type GameStatus = 'SETTING_UP' | 'CHOOSING' | "FINISHED";
export type GameResult = "TIE" | "PLAYER1_WIN" | "PLAYER2_WIN" | "ERROR";

export type PlayerRole = "player1" | "player2";


export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  ready: boolean;
  move?: Move;
  score: number;
}

export interface Game {
  id: string;
  players: Map<string, Player>;
  status: GameStatus;
  player1: string;
  player2: string;
}
