/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { SpeedBingoNetwork } from './network';
import { GameState, Player, BingoCell, BingoBoard, Ranking } from './types';
import LobbyView from './components/LobbyView';
import WaitingView from './components/WaitingView';
import RouletteView from './components/RouletteView';
import WritingView from './components/WritingView';
import PlayingView from './components/PlayingView';
import ResultView from './components/ResultView';
import { Sparkles, Signal, Shield, Cpu, Flame, Volume2, HelpCircle } from 'lucide-react';

const INITIAL_GAME_STATE: GameState = {
  status: 'lobby',
  gridSize: 5, // Default 5x5
  targetBingo: 2, // Default 2-bingo
  topic: '',
  writingTimeLimit: 300, // 5 minutes
  writingTimeRemaining: 300,
  currentRound: 0,
  roundStatus: 'waiting',
  buttonDelay: 0,
  btnActiveTime: null,
  clickWinnerId: null,
  matchedKeywords: [],
  players: [],
  boards: {},
  rankings: [],
  roulette: {
    isSpinning: false,
    winnerId: null,
    candidateIds: [],
    finalIndex: 0,
  },
};

export default function App() {
  const [network] = useState(() => new SpeedBingoNetwork());
  const [myId, setMyId] = useState('');
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchronized Game State (maintained by Host, mirrored by Clients)
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);

  // Keeps track of the milliseconds since the match started (for completion stats)
  const matchStartTimeRef = useRef<number | null>(null);

  // Active timers references to clean up easily
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playdelayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
      network.destroy();
    };
  }, []);

  const clearAllTimers = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (playdelayTimerRef.current) {
      clearTimeout(playdelayTimerRef.current);
      playdelayTimerRef.current = null;
    }
  };

  /**
   * Bingo Calculation algorithm supporting all dimensions (3x3, 4x4, 5x5)
   */
  const calculateBingos = (cells: BingoCell[], size: number): number => {
    let count = 0;

    // 1. Check Rows
    for (let r = 0; r < size; r++) {
      let rowMarked = true;
      for (let c = 0; c < size; c++) {
        if (!cells[r * size + c]?.isMarked) {
          rowMarked = false;
          break;
        }
      }
      if (rowMarked) count++;
    }

    // 2. Check Cols
    for (let c = 0; c < size; c++) {
      let colMarked = true;
      for (let r = 0; r < size; r++) {
        if (!cells[r * size + c]?.isMarked) {
          colMarked = false;
          break;
        }
      }
      if (colMarked) count++;
    }

    // 3. Diagonal Left Top -> Right Bottom
    let diag1Marked = true;
    for (let i = 0; i < size; i++) {
      if (!cells[i * size + i]?.isMarked) {
        diag1Marked = false;
        break;
      }
    }
    if (diag1Marked) count++;

    // 4. Diagonal Right Top -> Left Bottom
    let diag2Marked = true;
    for (let i = 0; i < size; i++) {
      if (!cells[i * size + (size - 1 - i)]?.isMarked) {
        diag2Marked = false;
        break;
      }
    }
    if (diag2Marked) count++;

    return count;
  };

  /**
   * Setup Network message listeners
   */
  const setupNetworkCallbacks = (net: SpeedBingoNetwork) => {
    net.onConnectionOpen = (id) => {
      setMyId(id);
      setIsLoading(false);
      setErrorMsg(null);
    };

    net.onConnectionClosed = (reason) => {
      // Disconnected from Host or peer closed
      setRoomId(null);
      setIsHost(false);
      setGameState(INITIAL_GAME_STATE);
      setErrorMsg(reason || '방에서 퇴장했거나 방이 닫혔습니다.');
      clearAllTimers();
    };

    net.onError = (err) => {
      setErrorMsg(err);
      setIsLoading(false);
    };

    net.onPlayerDisconnected = (disconnectedPlayerId) => {
      if (net.isHost) {
        handleHostOnDisconnect(disconnectedPlayerId);
      }
    };

    net.onMessage = (fromId, msg) => {
      if (net.isHost) {
        handleHostOnMessage(fromId, msg);
      } else {
        handleClientOnMessage(msg);
      }
    };
  };

  /**
   * HOST EVENT PROCESSORS
   */
  const handleHostOnDisconnect = (playerId: string) => {
    setGameState((prev) => {
      const updatedPlayers = prev.players.filter((p) => p.id !== playerId);
      
      // Clean up player's board
      const nextBoards = { ...prev.boards };
      delete nextBoards[playerId];

      const nextState: GameState = {
        ...prev,
        players: updatedPlayers,
        boards: nextBoards,
      };

      // If playing, check if ending conditions change
      if (nextState.status === 'playing') {
        checkEndingConditions(nextState);
      }

      // Broadcast new state
      network.broadcast('host:state_sync', nextState);
      return nextState;
    });
  };

  const handleHostOnMessage = (fromId: string, msg: any) => {
    const { type, payload } = msg;

    setGameState((prev) => {
      let nextState = { ...prev };

      switch (type) {
        case 'client:join': {
          // Add player if doesn't exist
          if (!nextState.players.some((p) => p.id === fromId)) {
            const newPlayer: Player = {
              id: fromId,
              name: payload.name || 'Anonymous',
              isHost: false,
              isReady: false,
              stats: { clickWins: 0, submittedKeywords: 0, bingoTime: null, finalBingoCount: 0 },
            };
            nextState.players = [...nextState.players, newPlayer];

            // Create blank board shape
            const blankBoard: BingoBoard = {
              playerId: fromId,
              cells: [],
              gridSize: prev.gridSize,
              completedBingoCount: 0,
              hasTargetBingo: false,
            };
            nextState.boards = { ...prev.boards, [fromId]: blankBoard };
          }
          break;
        }

        case 'client:update_name': {
          nextState.players = nextState.players.map((p) =>
            p.id === fromId ? { ...p, name: payload.name } : p
          );
          break;
        }

        case 'client:ready': {
          nextState.players = nextState.players.map((p) =>
            p.id === fromId ? { ...p, isReady: !p.isReady } : p
          );
          break;
        }

        case 'client:choose_topic': {
          nextState.topic = payload.topic;
          nextState.status = 'writing';
          nextState.writingTimeRemaining = prev.writingTimeLimit;

          // Restart countdown clock
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = setInterval(() => {
            setGameState((cur) => {
              if (cur.writingTimeRemaining <= 1) {
                if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
                // Countdown reached 0. Force start play mode!
                const forceState = { ...cur, writingTimeRemaining: 0 };
                forceTransitionToPlaying(forceState);
                return forceState;
              }
              const tickingState = {
                ...cur,
                writingTimeRemaining: cur.writingTimeRemaining - 1,
              };
              network.broadcast('host:state_sync', tickingState);
              return tickingState;
            });
          }, 1000);
          break;
        }

        case 'client:board_completed': {
          // Lock board cells
          const currentBoard = nextState.boards[fromId];
          if (currentBoard) {
            nextState.boards[fromId] = {
              ...currentBoard,
              cells: payload.cells,
              gridSize: prev.gridSize,
            };
          }

          // Toggle player ready status so other screens know they finished layout
          nextState.players = nextState.players.map((p) =>
            p.id === fromId ? { ...p, isReady: true } : p
          );

          // Check if ALL participants complete setup
          const allFinished = nextState.players.every(
            (p) => nextState.boards[p.id] && nextState.boards[p.id].cells.length > 0
          );

          if (allFinished) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            transitionToPlayingMode(nextState);
          }
          break;
        }

        case 'client:reaction_click': {
          // Confirm click speed winner if not decided yet this round
          if (nextState.roundStatus === 'button_active' && nextState.clickWinnerId === null) {
            nextState.clickWinnerId = fromId;
            nextState.roundStatus = 'keyword_entry';

            // Increase click accuracy stat
            nextState.players = nextState.players.map((p) =>
              p.id === fromId ? { ...p, stats: { ...p.stats, clickWins: p.stats.clickWins + 1 } } : p
            );
          }
          break;
        }

        case 'client:propose_keyword': {
          const proposed = payload.keyword.trim();
          if (proposed && nextState.clickWinnerId === fromId) {
            // Apply word to matched
            nextState.matchedKeywords = [...prev.matchedKeywords, proposed];

            // Increase keywords stats
            nextState.players = nextState.players.map((p) =>
              p.id === fromId
                ? { ...p, stats: { ...p.stats, submittedKeywords: p.stats.submittedKeywords + 1 } }
                : p
            );

            // Compute elapsed seconds since start
            const elapsedSeconds = matchStartTimeRef.current
              ? Math.floor((Date.now() - matchStartTimeRef.current) / 1000)
              : 0;

            // Search and check off matching word in ALL boards
            const updatedBoards = { ...nextState.boards };
            Object.keys(updatedBoards).forEach((pid) => {
              const b = updatedBoards[pid];
              const nextCells = b.cells.map((cell) => {
                if (cell.keyword.toLowerCase() === proposed.toLowerCase()) {
                  return { ...cell, isMarked: true };
                }
                return cell;
              });

              const nextCount = calculateBingos(nextCells, b.gridSize);
              const reachedTarget = nextCount >= prev.targetBingo;

              updatedBoards[pid] = {
                ...b,
                cells: nextCells,
                completedBingoCount: nextCount,
                hasTargetBingo: reachedTarget,
              };

              // If player hits targets, append to Rankings
              if (reachedTarget && !prev.rankings.some((r) => r.playerId === pid)) {
                const associatedPlayer = nextState.players.find((p) => p.id === pid);
                const nextRankNum = nextState.rankings.length + 1;

                const winRanking: Ranking = {
                  playerId: pid,
                  playerName: associatedPlayer ? associatedPlayer.name : 'Unknown Player',
                  rank: nextRankNum,
                  completionTime: elapsedSeconds,
                  board: updatedBoards[pid],
                  stats: associatedPlayer
                    ? {
                        ...associatedPlayer.stats,
                        bingoTime: elapsedSeconds,
                        finalBingoCount: nextCount,
                      }
                    : { clickWins: 0, submittedKeywords: 0, bingoTime: elapsedSeconds, finalBingoCount: nextCount },
                };

                nextState.rankings = [...nextState.rankings, winRanking];

                // Anchor elapsed timers to stats
                nextState.players = nextState.players.map((p) =>
                  p.id === pid
                    ? {
                        ...p,
                        stats: {
                          ...p.stats,
                          bingoTime: elapsedSeconds,
                          finalBingoCount: nextCount,
                        },
                      }
                    : p
                );
              }
            });

            nextState.boards = updatedBoards;

            // Log updated standings
            checkEndingConditions(nextState);
          }
          break;
        }

        case 'client:leave': {
          nextState.players = nextState.players.filter((p) => p.id !== fromId);
          delete nextState.boards[fromId];
          if (nextState.status === 'playing') {
            checkEndingConditions(nextState);
          }
          break;
        }
      }

      // Synchronize back to all listeners
      network.broadcast('host:state_sync', nextState);
      return nextState;
    });
  };

  /**
   * CLIENT EVENT RECEIVERS
   */
  const handleClientOnMessage = (msg: any) => {
    const { type, payload } = msg;
    if (type === 'host:state_sync') {
      setGameState(payload);
    } else if (type === 'client:leave') {
      // Host terminated room
      network.destroy();
      setRoomId(null);
      setIsHost(false);
      setGameState(INITIAL_GAME_STATE);
      setErrorMsg('호스트가 퇴장하여 방이 해체되었습니다.');
    }
  };

  /**
   * HOST BINGO MATCH LIFE CYCLE CONTROLLERS
   */
  const transitionToPlayingMode = (state: GameState) => {
    state.status = 'playing';
    state.currentRound = 1;
    state.roundStatus = 'waiting';
    state.matchedKeywords = [];
    state.rankings = [];

    // Clear ready indicators
    state.players = state.players.map((p) => ({ ...p, isReady: false }));

    matchStartTimeRef.current = Date.now();
    scheduleNextClickDelay(state);
  };

  const forceTransitionToPlaying = (state: GameState) => {
    // Fill incomplete boards with blank placeholders
    Object.keys(state.boards).forEach((pid) => {
      const b = state.boards[pid];
      if (!b.cells || b.cells.length === 0) {
        state.boards[pid] = {
          playerId: pid,
          cells: Array.from({ length: state.gridSize * state.gridSize }).map((_, i) => ({
            id: i,
            keyword: `자동칸 ${i + 1}`,
            isMarked: false,
          })),
          gridSize: state.gridSize,
          completedBingoCount: 0,
          hasTargetBingo: false,
        };
      }
    });

    transitionToPlayingMode(state);
  };

  const scheduleNextClickDelay = (state: GameState) => {
    if (playdelayTimerRef.current) clearTimeout(playdelayTimerRef.current);

    // Random timing delay 1s to 10s
    const triggerDelay = Math.floor(Math.random() * 9000) + 1000;
    state.buttonDelay = triggerDelay;
    state.roundStatus = 'waiting';
    state.clickWinnerId = null;

    playdelayTimerRef.current = setTimeout(() => {
      setGameState((cur) => {
        if (cur.status !== 'playing' || cur.roundStatus !== 'waiting') return cur;

        const nextActiveState = {
          ...cur,
          roundStatus: 'button_active' as const,
          btnActiveTime: Date.now(),
        };

        network.broadcast('host:state_sync', nextActiveState);
        return nextActiveState;
      });
    }, triggerDelay);
  };

  const checkEndingConditions = (state: GameState) => {
    const totalCount = state.players.length;
    let shouldTerminate = false;

    // Check ending constraints:
    // N >= 5 -> End when 3 spots are filled
    // N = 3-4 -> End when 1st spot is filled
    // N <= 2 -> End when 1st spot is filled
    if (totalCount >= 5) {
      if (state.rankings.length >= 3) shouldTerminate = true;
    } else {
      if (state.rankings.length >= 1) shouldTerminate = true;
    }

    if (shouldTerminate) {
      state.status = 'ended';
      clearAllTimers();

      // Finalize final line counts to statistics
      state.players = state.players.map((p) => {
        const board = state.boards[p.id];
        return {
          ...p,
          stats: {
            ...p.stats,
            finalBingoCount: board ? board.completedBingoCount : 0,
          },
        };
      });
    } else {
      // Loop into another round
      state.currentRound += 1;
      scheduleNextClickDelay(state);
    }
  };

  /**
   * USER TRIGGERS (COMMON AND VIEW ACTION HOOKS)
   */
  const handleHostRoom = async (pName: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    setNickname(pName);

    const generatedCode = SpeedBingoNetwork.generateRoomId();

    try {
      network.onConnectionOpen = (id) => {
        setMyId(id);
        setRoomId(generatedCode);
        setIsHost(true);
        setIsLoading(false);

        // Host setup master model
        const startingPlayers: Player[] = [
          {
            id,
            name: pName,
            isHost: true,
            isReady: true,
            stats: { clickWins: 0, submittedKeywords: 0, bingoTime: null, finalBingoCount: 0 },
          },
        ];

        const startingBoards: Record<string, BingoBoard> = {
          [id]: {
            playerId: id,
            cells: [],
            gridSize: 5,
            completedBingoCount: 0,
            hasTargetBingo: false,
          },
        };

        const updateState: GameState = {
          ...INITIAL_GAME_STATE,
          players: startingPlayers,
          boards: startingBoards,
        };

        setGameState(updateState);
      };

      setupNetworkCallbacks(network);
      await network.initHost(generatedCode);
    } catch (e: any) {
      setErrorMsg(e.message || '방 생성에 오류 발생.');
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (pName: string, targetRoomId: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    setNickname(pName);

    try {
      setupNetworkCallbacks(network);
      await network.initClient(targetRoomId, pName);
      setRoomId(targetRoomId);
      setIsHost(false);
    } catch (e: any) {
      setErrorMsg(e.message || '방 참가 오류 발생.');
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = (gridSize: number, targetBingo: number) => {
    if (!isHost) return;

    setGameState((prev) => {
      const updatedBoards = { ...prev.boards };
      Object.keys(updatedBoards).forEach((pid) => {
        updatedBoards[pid] = {
          ...updatedBoards[pid],
          gridSize,
          cells: [], // reset cells to avoid size conflict
        };
      });

      const nextState: GameState = {
        ...prev,
        gridSize,
        targetBingo,
        boards: updatedBoards,
      };

      network.broadcast('host:state_sync', nextState);
      return nextState;
    });
  };

  const handleToggleReady = () => {
    if (isHost) return;
    network.sendToHost('client:ready', null);
  };

  const handleStartGame = () => {
    if (!isHost) return;

    setGameState((prev) => {
      // Trigger Spin on all screens
      const contestants = prev.players;
      const winner = contestants[Math.floor(Math.random() * contestants.length)];

      // Build a repeated pattern roster for spins (e.g. at least 45 names taller)
      const repeatCount = Math.ceil(40 / contestants.length) || 3;
      const reels: string[] = [];
      for (let i = 0; i < repeatCount; i++) {
        contestants.forEach((p) => reels.push(p.id));
      }

      // Pin exact stopping index near the bottom list
      const pinIndex = reels.lastIndexOf(winner.id);

      const nextState: GameState = {
        ...prev,
        status: 'roulette',
        roulette: {
          isSpinning: true,
          winnerId: winner.id,
          candidateIds: reels,
          finalIndex: pinIndex >= 0 ? pinIndex : 0,
        },
      };

      network.broadcast('host:state_sync', nextState);
      return nextState;
    });
  };

  const handleProposeTopic = (topic: string) => {
    if (gameState.roulette.winnerId === myId) {
      if (isHost) {
        // Handle locally
        handleHostOnMessage(myId, {
          type: 'client:choose_topic',
          payload: { topic },
        });
      } else {
        network.sendToHost('client:choose_topic', { topic });
      }
    }
  };

  const handleCompleteBoard = (cells: BingoCell[]) => {
    if (isHost) {
      handleHostOnMessage(myId, {
        type: 'client:board_completed',
        payload: { cells },
      });
    } else {
      network.sendToHost('client:board_completed', { cells });
    }
  };

  const handleReactionClick = (reactionTimeMs: number) => {
    if (isHost) {
      handleHostOnMessage(myId, {
        type: 'client:reaction_click',
        payload: { reactionTime: reactionTimeMs },
      });
    } else {
      network.sendToHost('client:reaction_click', { reactionTime: reactionTimeMs });
    }
  };

  const handleProposeKeyword = (keyword: string) => {
    if (gameState.clickWinnerId === myId) {
      if (isHost) {
        handleHostOnMessage(myId, {
          type: 'client:propose_keyword',
          payload: { keyword },
        });
      } else {
        network.sendToHost('client:propose_keyword', { keyword });
      }
    }
  };

  const handlePlayAgain = () => {
    if (!isHost) return;

    setGameState((prev) => {
      // Clean previous logs and rankings, reset status to Lobby (Waiting)
      const freshBoards = { ...prev.boards };
      Object.keys(freshBoards).forEach((pid) => {
        freshBoards[pid] = {
          playerId: pid,
          cells: [],
          gridSize: prev.gridSize,
          completedBingoCount: 0,
          hasTargetBingo: false,
        };
      });

      const nextState: GameState = {
        ...prev,
        status: 'lobby',
        topic: '',
        currentRound: 0,
        roundStatus: 'waiting',
        clickWinnerId: null,
        matchedKeywords: [],
        boards: freshBoards,
        rankings: [],
        players: prev.players.map((p) => ({
          ...p,
          isReady: p.isHost, // Host locks ready automatically
          stats: { clickWins: 0, submittedKeywords: 0, bingoTime: null, finalBingoCount: 0 },
        })),
        roulette: {
          isSpinning: false,
          winnerId: null,
          candidateIds: [],
          finalIndex: 0,
        },
      };

      network.broadcast('host:state_sync', nextState);
      return nextState;
    });
  };

  const handleLeaveRoom = () => {
    clearAllTimers();
    network.destroy();
    setRoomId(null);
    setIsHost(false);
    setGameState(INITIAL_GAME_STATE);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-neonYellow selection:text-black">
      
      {/* Sleek Design Theme Header */}
      <header className="h-20 border-b-2 border-burgundy bg-[#111111] flex items-center justify-between px-8 shadow-2xl z-50">
        <div className="flex items-center gap-4">
          <div className="bg-neonYellow p-2 rounded-sm rotate-3 select-none">
            <span className="text-black font-black text-xl italic leading-none block">SPEED</span>
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-neonYellow select-none">
            BINGO <span className="text-white opacity-40 text-sm align-super font-mono">v2.0</span>
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-burgundy-light font-black leading-none mb-1">Room ID</p>
            <p className="text-xl font-mono text-neonYellow leading-none font-bold select-all tracking-wider">
              {roomId || "OFFLINE"}
            </p>
          </div>
          <div className="h-10 w-[1px] bg-white opacity-10"></div>
          <div className="flex items-center gap-3 select-none">
            <div className={`w-3 h-3 rounded-full ${roomId ? "bg-neonYellow animate-pulse" : "bg-red-500"}`} />
            <span className="text-sm font-bold uppercase tracking-tight">
              {gameState.players.length} PLAYERS ONLINE
            </span>
          </div>
        </div>
      </header>

      {/* Main gaming viewport frame containers */}
      <main className="flex-1 flex items-center justify-center py-8 px-4 relative overflow-hidden bg-[radial-gradient(circle_at_center,_#1A1A1A_0%,_#0A0A0A_100%)]">
        
        {/* Subtle grid background pattern decoration from design template */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="w-full max-w-6xl z-10">
          {gameState.status === 'lobby' && !roomId ? (
            <LobbyView
              onHostRoom={handleHostRoom}
              onJoinRoom={handleJoinRoom}
              isLoading={isLoading}
              error={errorMsg}
            />
          ) : gameState.status === 'lobby' && roomId ? (
            <WaitingView
              roomId={roomId}
              myId={myId}
              players={gameState.players}
              gridSize={gameState.gridSize}
              targetBingo={gameState.targetBingo}
              isHost={isHost}
              onUpdateSettings={handleUpdateSettings}
              onToggleReady={handleToggleReady}
              onStartGame={handleStartGame}
              onLeaveRoom={handleLeaveRoom}
            />
          ) : gameState.status === 'roulette' ? (
            <RouletteView
              roulette={gameState.roulette}
              players={gameState.players}
              myId={myId}
              isHost={isHost}
              onSubmitTopic={handleProposeTopic}
            />
          ) : gameState.status === 'writing' ? (
            <WritingView
              topic={gameState.topic}
              gridSize={gameState.gridSize}
              writingTimeRemaining={gameState.writingTimeRemaining}
              players={gameState.players}
              myId={myId}
              onCompleteBoard={handleCompleteBoard}
            />
          ) : gameState.status === 'playing' ? (
            <PlayingView
              gameState={gameState}
              myId={myId}
              isHost={isHost}
              onReactionClick={handleReactionClick}
              onSubmitKeyword={handleProposeKeyword}
            />
          ) : gameState.status === 'ended' ? (
            <ResultView
              rankings={gameState.rankings}
              players={gameState.players}
              myId={myId}
              isHost={isHost}
              onPlayAgain={handlePlayAgain}
              onLeaveRoom={handleLeaveRoom}
            />
          ) : (
            <div className="p-8 text-center bg-black border border-burgundy/10 rounded-xl">
              <p className="text-zinc-500 font-sans">상태 오류 또는 유효하지 않은 게임 플로우입니다.</p>
              <button
                onClick={handleLeaveRoom}
                className="mt-4 px-4 py-2 bg-burgundy text-white text-xs rounded-lg"
              >
                로비로 탈출하기
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Sleek Design Theme Footer */}
      <footer className="h-12 bg-[#0A0A0A] border-t border-burgundy flex items-center justify-between px-8 text-[10px] font-mono tracking-widest text-[#888888] select-none">
        <div className="flex gap-6">
          <span>SYSTEM: STABLE</span>
          <span>PING: 24MS</span>
          <span>P2P: {roomId ? "CONNECTED" : "OFFLINE"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1 h-1 bg-white rounded-full"></span>
          <span className="uppercase">SUBJECT: {gameState.topic || "LOBBY"}</span>
        </div>
      </footer>

    </div>
  );
}
