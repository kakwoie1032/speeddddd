/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Shield, Grid, HelpCircle } from 'lucide-react';
import { GameState, BingoBoard, Player, BingoCell } from '../types';

interface PlayingViewProps {
  gameState: GameState;
  myId: string;
  isHost: boolean;
  onReactionClick: (reactionTimeMs: number) => void;
  onSubmitKeyword: (keyword: string) => void;
}

export default function PlayingView({
  gameState,
  myId,
  isHost,
  onReactionClick,
  onSubmitKeyword,
}: PlayingViewProps) {
  const {
    topic,
    roundStatus,
    clickWinnerId,
    matchedKeywords,
    players,
    boards,
    rankings,
    currentRound,
    targetBingo,
  } = gameState;

  const [keywordInput, setKeywordInput] = useState('');
  const [clickTime, setClickTime] = useState<number | null>(null);

  const myPlayer = players.find((p) => p.id === myId);
  const myBoard = boards[myId];
  const clickWinnerPlayer = players.find((p) => p.id === clickWinnerId);
  const isMeClickWinner = clickWinnerId === myId;

  // React to button entry and record render timestamp
  useEffect(() => {
    if (roundStatus === 'button_active') {
      setClickTime(Date.now());
    } else if (roundStatus !== 'keyword_entry') {
      setKeywordInput('');
    }
  }, [roundStatus]);

  // Click handler
  const handleClickButton = () => {
    if (roundStatus !== 'button_active' || !clickTime) return;
    const reactionTimeMs = Date.now() - clickTime;
    onReactionClick(reactionTimeMs);
  };

  // Keyboard word submission
  const handleKeywordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const word = keywordInput.trim();
    if (!word) return;
    onSubmitKeyword(word);
    setKeywordInput('');
  };

  // Click a word on one's own board to auto-fill the keyword input box
  const handleCellClickAndFill = (cell: BingoCell) => {
    if (!isMeClickWinner || roundStatus !== 'keyword_entry') return;
    if (cell.isMarked) return;
    setKeywordInput(cell.keyword);
  };

  // Grid sizing styled helper
  const getGridColsClass = (gridSize: number) => {
    if (gridSize === 3) return 'grid-cols-3';
    if (gridSize === 4) return 'grid-cols-4';
    return 'grid-cols-5';
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row bg-[#0A0A0A] border-2 border-white/10 rounded-xl overflow-hidden shadow-2xl select-none">
      
      {/* 1. Left Sidebar: Competitors list */}
      <aside className="w-full lg:w-64 bg-[#111111] p-6 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-white/5">
        <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">Competitors</h2>
        <div className="flex flex-col gap-2 max-h-[180px] lg:max-h-none overflow-y-auto pr-1">
          {players.map((p) => {
            const isMe = p.id === myId;
            const plistBoard = boards[p.id];
            const pBingoCount = plistBoard ? plistBoard.completedBingoCount : 0;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 transition-all rounded-r ${
                  isMe
                    ? 'bg-[#630D16]/20 border-l-2 border-[#E1FF00]'
                    : 'hover:bg-white/5 bg-black/10 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center font-black text-xs ${
                    p.isHost ? 'bg-[#E1FF00] text-black' : 'bg-[#333333] text-white'
                  }`}>
                    {p.isHost ? 'H' : p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate max-w-[100px]">{p.name}</p>
                    <p className="text-[10px] text-[#E1FF00]/80">
                      {p.isHost ? 'HOST' : 'PLAYER'} {isMe && '(나)'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded leading-none ${
                    pBingoCount >= targetBingo ? 'bg-green-500/20 text-green-400 font-extrabold' : 'bg-black/40 text-[#E1FF00] font-bold'
                  }`}>
                    {pBingoCount} 줄
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto p-4 border border-white/10 rounded-lg bg-black/40 hidden lg:block">
          <p className="text-[10px] text-white/40 uppercase mb-1">Target</p>
          <p className="text-lg font-bold text-white">{targetBingo} BINGOS</p>
        </div>
      </aside>

      {/* 2. Middle Game Center Area */}
      <section className="flex-1 relative flex flex-col items-center justify-center py-10 px-6 min-h-[460px] bg-[radial-gradient(circle_at_center,_#1c1c1c_0%,_#0a0a0a_100%)]">
        
        {/* Background Grid Decoration */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        {/* Dynamic header stats above card */}
        <div className="mb-4 text-center z-10 select-none">
          <span className="font-sans text-[10px] text-[#E1FF00] font-black uppercase tracking-widest bg-[#630D16]/20 border border-[#630D16]/40 px-3 py-1 rounded-full">
            주제: {topic}
          </span>
        </div>

        {/* Bingo Board Container */}
        <div className="bg-black p-4 rounded-xl border border-white/10 shadow-2xl z-10 w-full max-w-sm">
          {myBoard ? (
            <div className={`grid ${getGridColsClass(myBoard.gridSize)} gap-2`}>
              {myBoard.cells.map((cell) => {
                const isMarked = cell.isMarked;
                return (
                  <button
                    onClick={() => handleCellClickAndFill(cell)}
                    key={cell.id}
                    title={
                      isMeClickWinner && !cell.isMarked
                        ? '클릭 시 단어창에 자동 입력됩니다.'
                        : undefined
                    }
                    className={`relative aspect-square flex flex-col justify-center items-center p-1 rounded transition-all text-center ${
                      isMarked
                        ? 'bg-[#630D16] border border-[#E1FF00] text-white shadow-[0_0_15px_rgba(225,255,0,0.25)]'
                        : isMeClickWinner && roundStatus === 'keyword_entry'
                        ? 'bg-[#1a1c10] border border-yellow-500/60 cursor-pointer hover:border-neonYellow text-white'
                        : 'bg-[#1F1F1F] border border-white/5 text-[#D0D0D0]'
                    }`}
                  >
                    <span className={`text-[10px] sm:text-xs font-black select-all break-all tracking-tight leading-tight px-0.5 ${
                      isMarked ? 'font-bold text-neonYellow text-neon-glow' : 'text-zinc-300'
                    }`}>
                      {cell.keyword}
                    </span>
                    <span className="absolute bottom-0.5 right-1 font-mono text-[7px] text-white/20">
                      {(cell.id + 1).toString().padStart(2, '0')}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-[#A0A0A0]">빙고판을 찾을 수 없습니다.</div>
          )}
        </div>

        {/* Form area for keyword entry below grid */}
        {roundStatus === 'keyword_entry' && (
          <div className="mt-5 w-full max-w-xs bg-[#111111] border border-white/10 rounded-xl p-4 shadow-xl z-20">
            {isMeClickWinner ? (
              <form onSubmit={handleKeywordSubmit} className="space-y-2">
                <div className="flex items-center gap-1.5 text-neonYellow font-mono text-[10px] uppercase font-black">
                  <span className="w-1.5 h-1.5 rounded-full bg-neonYellow animate-ping inline-block" /> 클릭 선점 성공!
                </div>
                <h4 className="text-xs text-white/90 font-sans font-bold">빙고판 단어 입력:</h4>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="제시할 단어 입력"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 bg-[#0A0A0A] border border-neonYellow/40 rounded focus:border-neonYellow text-xs text-white font-bold select-all focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1 px-2.5 py-1 bg-neonYellow hover:bg-yellow-300 text-black text-[10px] font-black rounded"
                  >
                    제시
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-2 space-y-1.5 flex flex-col items-center">
                <div className="w-4 h-4 border-2 border-[#E1FF00] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-zinc-400 font-sans font-semibold">
                  <strong className="text-white font-bold">{clickWinnerPlayer ? clickWinnerPlayer.name : 'Unknown'}</strong>님이 단어를 입력하고 있습니다...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Floating click prompt overlay */}
        {roundStatus === 'waiting' && (
          <div className="mt-4 px-4 py-2 bg-black/80 backdrop-blur-md rounded-full border border-zinc-800 text-[#E1FF00] font-mono text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span>WAITING FOR TRIGGER...</span>
          </div>
        )}

        {/* Reaction Absolute Button Overlay */}
        {roundStatus === 'button_active' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center">
            <button
              onClick={handleClickButton}
              className="w-48 h-48 rounded-full bg-[#E1FF00] shadow-[0_0_50px_rgba(225,255,0,0.5)] border-8 border-black flex items-center justify-center transform active:scale-95 hover:scale-105 transition-transform group cursor-pointer outline-none"
            >
              <span className="text-black font-black text-4xl tracking-tighter italic">CLICK!</span>
            </button>
            <div className="mt-6 px-4 py-2 bg-black/80 backdrop-blur-md rounded-full border border-[#E1FF00]/50 text-[#E1FF00] font-mono text-xs font-black animate-pulse uppercase tracking-widest">
              SMASH THE TRIGGER BUTTON FIRST!
            </div>
          </div>
        )}
      </section>

      {/* 3. Right Sidebar: Live Feed / Progress */}
      <aside className="w-full lg:w-72 bg-[#111111] p-6 flex flex-col border-t lg:border-t-0 lg:border-l border-white/5">
        <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Live Feed</h2>
        
        <div className="space-y-3 flex-1 overflow-y-auto max-h-[180px] lg:max-h-none pr-1">
          <div className="p-3 bg-[#630D16]/40 rounded border-l-2 border-[#E1FF00]">
            <p className="text-[10px] text-[#E1FF00] font-bold mb-1 uppercase tracking-wider">Alert</p>
            <p className="text-[11px] font-bold italic">ROUND {currentRound} STARTING WITH ACTIVE REFLEX...</p>
          </div>

          {matchedKeywords.length === 0 ? (
            <div className="p-3 rounded border-l-2 border-white/5 bg-black/20 text-center text-zinc-600 text-xs italic">
              아직 제안된 단어가 없습니다.
            </div>
          ) : (
            [...matchedKeywords].reverse().map((word, index) => (
              <div key={index} className="p-3 bg-[#1F1F1F] rounded border-l-2 border-white/10">
                <p className="text-[9px] text-white/40 mb-0.5 font-mono">제안 번호 #{matchedKeywords.length - index}</p>
                <p className="text-[11px] font-medium">
                  <span className="text-[#E1FF00] font-bold">BINGO MATCH</span> &bull; <span className="font-mono text-white underline">{word}</span>
                </p>
              </div>
            ))
          )}
        </div>

        {myBoard && (
          <div className="mt-auto space-y-2 pt-4 border-t border-white/5">
            <div className="flex justify-between items-end">
              <span className="text-[10px] uppercase font-bold text-white/40">Current Status</span>
              <span className="text-2xl font-black text-[#E1FF00]">{myBoard.completedBingoCount}/{targetBingo}</span>
            </div>
            <div className="w-full h-2 bg-[#1F1F1F] rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (myBoard.completedBingoCount / targetBingo) * 100)}%` }}
                className="h-full bg-[#E1FF00] rounded-full shadow-[0_0_10px_rgba(225,255,0,0.5)] transition-all duration-300"
              />
            </div>
            <p className="text-[10px] text-right text-white/30">
              {Math.round(Math.min(100, (myBoard.completedBingoCount / targetBingo) * 100))}% Progress
            </p>
          </div>
        )}
      </aside>

    </div>
  );
}
