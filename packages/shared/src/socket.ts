import type { GameSnapshot, Move, RoundResolution } from "./game";

export interface SocketData {
  roomId?: string;
  userId?: string;
}

export interface ClientToServerEvents {
  readyUp: (data: { name: string }) => void;
  submitMove: (data: { move: Move }) => void;
  requestReplay: () => void;
}

export interface ServerToClientEvents {
  error: (data: { message: string }) => void;
  assignedSlot: (data: { slot: 'player1' | 'player2' }) => void;
  playerJoined: (data: { snapshot: GameSnapshot }) => void;
  readyPhaseStarted: () => void;
  readied: (data: { playerId: string }) => void;
  allReady: () => void;
  playerLeft: (data: { playerId: string }) => void;
  replayRequested: (data: { playerId: string }) => void;  
  replayRound: () => void;
  roundResolved: (data: { resolution: RoundResolution }) => void;
}
