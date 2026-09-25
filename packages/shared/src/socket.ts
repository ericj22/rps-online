import type { GameResult, Move, Player } from "./game";

export interface SocketData {
  roomId?: string;
  userId?: string;
}

export interface ClientToServerEvents {
  readyUp: (data: { name: string }) => void;
  submitMove: (data: { move: Move }) => void;
  replay: () => void;
}

export interface ServerToClientEvents {
  gameStart: () => void;
  readied: (data: { playerId: string }) => void;
  allReady: () => void;
  playerLeft: (data: { playerId: string }) => void;
  replayRound: () => void;
  roundResolved: (data: { players: Player[], result: GameResult }) => void;
}
