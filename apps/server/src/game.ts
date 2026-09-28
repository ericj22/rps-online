import type { GameSnapshot, GameStatus, Move, Player, RoundResolution, RoundResult } from "@rps/shared";

const BEATS: Record<Move, Move> = {
  ROCK: 'SCISSORS',
  PAPER: 'ROCK',
  SCISSORS: 'PAPER',
};

export class GameSession {
  readonly id: string;
  private _status: GameStatus = 'WAITING_FOR_PLAYERS';
  private _player1: Player | null = null;
  private _player2: Player | null = null;

  constructor(id: string) {
    this.id = id;
  }

  get status(): GameStatus {
    return this._status;
  }

  get isFull(): boolean {
    return this._player1 !== null && this._player2 !== null;
  }

  get isEmpty(): boolean {
    return this._player1 === null && this._player2 === null;
  }

  join(playerId: string): 'player1' | 'player2' {
    if (this._player1?.id === playerId) return 'player1';
    if (this._player2?.id === playerId) return 'player2';

    if (this.isFull) {
      throw new Error('Game session is full');
    }

    const newPlayer: Player = {
      id: playerId,
      name: '',
      ready: false,
      score: 0,
      replayRequested: false,
    };

    let slot: 'player1' | 'player2';

    if (!this._player1) {
      this._player1 = newPlayer;
      slot = 'player1';
    } else {
      this._player2 = newPlayer;
      slot = 'player2';
    }

    if (this.isFull) {
      this._status = 'READYING_UP';
    }

    return slot;
  }

  leave(playerId: string): { remainingPlayer: Player | null; isEmpty: boolean } {
    if (this._player1?.id === playerId) {
      this._player1 = this._player2;
      this._player2 = null;
    } else if (this._player2?.id === playerId) {
      this._player2 = null;
    } else {
      return { remainingPlayer: this._player1, isEmpty: this.isEmpty };
    }

    if (this._player1) {
      this._player1.ready = false;
      this._player1.move = undefined;
      this._player1.replayRequested = false;
      this._status = 'WAITING_FOR_PLAYERS';
    } else {
      this._status = 'WAITING_FOR_PLAYERS';
    }

    return {
      remainingPlayer: this._player1 ? { ...this._player1 } : null,
      isEmpty: this.isEmpty,
    }
  }

  ready(playerId: string, name: string): { allReady: boolean } {
    if (this._status !== 'READYING_UP') {
      throw new Error('Incorrect status for readying up');
    }

    const player = this.findPlayer(playerId);
    if (!player) {
      throw new Error('Player not found in this session');
    }

    player.name = name.trim() || player.name || 'unknown';
    player.ready = true;

    const bothReady = Boolean(this._player1?.ready && this._player2?.ready);
    if (bothReady) {
      this._status = 'CHOOSING';
    }

    return { allReady: bothReady };
  }

  submitMove(playerId: string, move: Move): RoundResolution | null {
    if (this._status !== 'CHOOSING') {
      throw new Error('Can only submit move in Choosing state');
    }

    const player = this.findPlayer(playerId);
    if (!player) {
      throw new Error('Player not found in session');
    }
    player.move = move;

    if (this._player1?.move && this._player2?.move) {
      const p1Move = this._player1?.move;
      const p2Move = this._player2?.move;
      const roundResult = this.evaluateWinner(p1Move, p2Move);
      
      if (roundResult === 'PLAYER1_WIN') {
        this._player1.score += 1
        this._status = 'ROUND_RESOLVED';
      } else if (roundResult === 'PLAYER2_WIN') {
        this._player2.score += 1
        this._status = 'ROUND_RESOLVED';
      } else {
        // DON'T RESOLVE ROUND IF TIE - reset moves
        // TODO: Then return a tie signal
        this._player1.move = undefined;
        this._player2.move = undefined;
      }

      return {
        result: roundResult,
        p1Move: p1Move,
        p2Move: p2Move,
        p1Score: this._player1.score,
        p2Score: this._player2.score,
      }

    } else {
      return null;
    }
  }

  requestReplay(playerId: string): { roundReset: boolean } {
    if (this._status !== 'ROUND_RESOLVED') {
      throw new Error(`Cannot replay round in state ${this._status}`);
    }

    const player = this.findPlayer(playerId);
    if (!player) {
      throw new Error('Player not found in session');
    }

    player.replayRequested = true;

    const bothRequest = Boolean(this._player1?.replayRequested && this._player2?.replayRequested);

    if (bothRequest) {
      this._player1!.replayRequested = false;
      this._player2!.replayRequested = false;
      this._player1!.move = undefined;
      this._player2!.move = undefined;
      this._status = 'CHOOSING';
    }

    return { roundReset: bothRequest };
  }

  getSnapshot(): GameSnapshot {
    return {
      id: this.id,
      status: this._status,
      player1: this._player1 ? { ...this._player1 } : null,
      player2: this._player2 ? { ...this._player2 } : null,
    };
  }


  // Internals
  private findPlayer(id: string): Player | null {
    if (this._player1?.id === id) return this._player1;
    if (this._player2?.id === id) return this._player2;
    return null;
  }

  private evaluateWinner(p1Move: Move, p2Move: Move): RoundResult {
    if (p1Move === p2Move) return 'TIE';
    return BEATS[p1Move] === p2Move ? 'PLAYER1_WIN' : 'PLAYER2_WIN';
  }
}

