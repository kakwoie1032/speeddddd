/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Statistics {
  clickWins: number;          // Number of times won the direct click button
  submittedKeywords: number;  // Number of valid keywords proposed by this player
  bingoTime: number | null;   // Elapsed seconds since starting play until completing the target bingo count
  finalBingoCount: number;    // Number of bingos at the end of the game
}

export interface Player {
  id: string;        // PeerJS dynamic or custom ID
  name: string;      // User chosen nickname
  isHost: boolean;   // Whether the player is host
  isReady: boolean;  // Ready state in lobbies
  stats: Statistics; // Cumulative metrics
}

export interface BingoCell {
  id: number;        // Unique id (index in array, 0 to size*size - 1)
  keyword: string;   // Text written in the cell
  isMarked: boolean; // Whether the keyword has been checked off
}

export interface BingoBoard {
  playerId: string;
  cells: BingoCell[];
  gridSize: number;             // E.g. 3 for 3x3, 4 for 4x4, 5 for 5x5
  completedBingoCount: number;  // Calculated lines (rows, columns, diagonals)
  hasTargetBingo: boolean;      // Did they hit the target bingo count?
}

export interface Ranking {
  playerId: string;
  playerName: string;
  rank: number;             // 1, 2, 3...
  completionTime: number;   // Elapsed time in seconds from start
  board: BingoBoard;        // Snapshot of final board
  stats: Statistics;        // Stats at moment of win
}

export interface RouletteState {
  isSpinning: boolean;
  winnerId: string | null;
  candidateIds: string[];
  finalIndex: number;
}

export type GameStatus = 'lobby' | 'roulette' | 'topic_selection' | 'writing' | 'playing' | 'ended';
export type RoundStatus = 'waiting' | 'button_active' | 'keyword_entry';

export interface GameState {
  status: GameStatus;
  gridSize: number;             // 3 (3x3), 4 (4x4), 5 (5x5)
  targetBingo: number;          // Target number of bingos to win (1, 2, 3...)
  topic: string;                // Active topic (e.g., '동물')
  writingTimeLimit: number;     // Countdown duration (default 300s = 5mins)
  writingTimeRemaining: number; // Countdown tracker
  currentRound: number;
  roundStatus: RoundStatus;
  buttonDelay: number;          // Randomized next trigger (milliseconds, e.g. 1000 - 10000)
  btnActiveTime: number | null; // Precise performance timestamp when visual button loaded
  clickWinnerId: string | null; // Who was the fastest to click
  matchedKeywords: string[];     // History of played words
  players: Player[];            // Connected lobby/game players
  boards: Record<string, BingoBoard>; // Player ID to BingoBoard map
  rankings: Ranking[];          // Speed leaders
  roulette: RouletteState;
}

export type NetworkMessageType =
  | 'host:state_sync'
  | 'host:click_winner'
  | 'client:join'
  | 'client:update_name'
  | 'client:ready'
  | 'client:choose_topic'
  | 'client:board_completed'
  | 'client:reaction_click'
  | 'client:propose_keyword'
  | 'client:reset_game'
  | 'client:leave';

export interface NetworkMessage {
  type: NetworkMessageType;
  payload: any;
}
