export type Move = 'ROCK' | 'PAPER' | 'SCISSORS';

export interface ClientToServerEvents {
  joinRoom: (roomId: string) => void;
  submitMove: (data: { roomId: string; move: Move }) => void;
}

export interface ServerToClientEvents {
  opponentJoined: () => void;
  opponentSubmitted: () => void;
  roundResolved: (data: { yourMove: Move; opponentMove: Move; result: string }) => void;
}