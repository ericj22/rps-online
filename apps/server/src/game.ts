import type { GameResult, Player } from "@rps/shared";

export function resolveGame(player1: Player, player2: Player): GameResult {
  if (!player1.move || !player2.move) {
    return "ERROR";
  }

  if (player1.move === player2.move) {
    return "TIE";
  }
  
  if (player1.move === "PAPER" && player2.move === "ROCK") {
    return "PLAYER1_WIN";
  } else if (player1.move === "ROCK" && player2.move === "SCISSORS") {
    return "PLAYER1_WIN";
  } else if (player1.move === "SCISSORS" && player2.move === "PAPER") {
    return "PLAYER1_WIN";
  } else {
    return "PLAYER2_WIN";
  }
}