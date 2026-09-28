export type Move = 'ROCK' | 'PAPER' | 'SCISSORS';

export type GameStatus = 
  | 'WAITING_FOR_PLAYERS'
  | 'READYING_UP' 
  | 'CHOOSING' 
  | 'ROUND_RESOLVED';

export type RoundResult = "TIE" | "PLAYER1_WIN" | "PLAYER2_WIN";

export interface Player {
  id: string;
  name: string;
  ready: boolean;
  move?: Move;
  score: number;
  replayRequested: boolean;
};

export interface RoundResolution {
  result: RoundResult;
  p1Move: Move;
  p2Move: Move;
  p1Score: number;
  p2Score: number;
};

export interface GameSnapshot {
  id: string;
  status: GameStatus;
  player1: Player | null;
  player2: Player | null;
};

export interface Game {
  id: string;
  idToRole: Map<string, number>;
  players: Player[];
  status: GameStatus;
};
