import { randomBytes } from "node:crypto";
import { GameSession } from "../domain/game";

export class RoomManager {
  private games = new Map<string, GameSession>();
  private timeouts = new Map<string, NodeJS.Timeout>();

  createRoom(): string {
    let roomId: string;
    do {
      roomId = randomBytes(3).toString("hex");
    } while (this.games.has(roomId));

    this.games.set(roomId, new GameSession(roomId));
    this.scheduleTtl(roomId, 60_000);
    return roomId;
  }

  get(roomId: string): GameSession | undefined {
    return this.games.get(roomId);
  }

  delete(roomId: string): void {
    this.clearTtl(roomId);
    this.games.delete(roomId);
  }

  scheduleTtl(roomId: string, ms: number): void {
    this.clearTtl(roomId);
    this.timeouts.set(
      roomId,
      setTimeout(() => {
        const game = this.games.get(roomId);
        if (!game || game.isEmpty) {
          this.delete(roomId);
        }
      }, ms)
    );
  }

  clearTtl(roomId: string): void {
    const timer = this.timeouts.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.timeouts.delete(roomId);
    }
  }
}
