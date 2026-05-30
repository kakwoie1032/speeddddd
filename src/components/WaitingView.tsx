/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, Users, Shield, Play, LogOut, CheckCircle, Flame } from 'lucide-react';
import { Player } from '../types';

interface WaitingViewProps {
  roomId: string;
  myId: string;
  players: Player[];
  gridSize: number;
  targetBingo: number;
  isHost: boolean;
  onUpdateSettings: (gridSize: number, targetBingo: number) => void;
  onToggleReady: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export default function WaitingView({
  roomId,
  myId,
  players,
  gridSize,
  targetBingo,
  isHost,
  onUpdateSettings,
  onToggleReady,
  onStartGame,
  onLeaveRoom,
}: WaitingViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const myPlayer = players.find((p) => p.id === myId);
  const isMeReady = myPlayer ? myPlayer.isReady : false;

  // Clients must all be ready.
  // We can let the host start solo for testing or if all clients are ready.
  const clients = players.filter((p) => !p.isHost);
  const isEveryoneReady = clients.length > 0 && clients.every((c) => c.isReady);

  // Reasonable bounds for target bingos based on board size
  const maxTargets = gridSize === 3 ? 3 : gridSize === 4 ? 4 : 5;

  const handleGridChange = (newSize: number) => {
    let newTarget = targetBingo;
    if (newSize === 3 && targetBingo > 3) newTarget = 3;
    if (newSize === 4 && targetBingo > 4) newTarget = 4;
    onUpdateSettings(newSize, newTarget);
  };

  const handleTargetChange = (newTarget: number) => {
    onUpdateSettings(gridSize, newTarget);
  };

  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
      
      {/* Left panel: Room Identity & Game Config */}
      <div className="md:col-span-1 flex flex-col gap-6 bg-[#111111] p-5 rounded-xl border border-burgundy/40 shadow-xl select-none burgundy-shadow">
        
        {/* Room Code Showcase */}
        <div>
          <span className="font-sans text-[10px] text-[#A0A0A0] uppercase tracking-wider font-bold">참가 코드</span>
          <div className="flex items-center gap-2 mt-1.5 p-3.5 bg-black rounded-lg border border-burgundy/20">
            <span className="font-mono font-black text-2xl text-neonYellow tracking-wider flex-1 text-center select-all">
              {roomId}
            </span>
            <button
              onClick={handleCopyCode}
              title="코드 복사"
              className="p-2 rounded bg-burgundy/20 border border-burgundy/30 text-neonYellow hover:bg-burgundy/40 active:scale-95 transition-all outline-none"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {copied && (
            <p className="mt-1.5 text-center text-[10px] text-neonYellow font-semibold">
              코드가 클립보드에 복사되었습니다!
            </p>
          )}
        </div>

        {/* Configuration Segment */}
        <div className="flex-1 flex flex-col gap-4 border-t border-burgundy/10 pt-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-neonYellow" />
            <h3 className="font-display font-semibold text-[#E1FF00] text-sm uppercase tracking-wider">
              경기 룰 성정
            </h3>
          </div>

          {/* Grid Size Slider / Select */}
          <div>
            <label className="block text-[11px] text-[#A0A0A0] font-sans font-semibold uppercase tracking-wider mb-2">
              빙고 크기 (Grid Size)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[3, 4, 5].map((size) => (
                <button
                  key={size}
                  disabled={!isHost}
                  onClick={() => handleGridChange(size)}
                  className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all ${
                    gridSize === size
                      ? 'bg-neonYellow text-black border-none font-extrabold shadow-cyan-900/10'
                      : 'bg-black text-[#A0A0A0] border-burgundy/20 hover:border-burgundy/40 hover:text-white'
                  } ${!isHost ? 'cursor-not-allowed opacity-80' : ''}`}
                >
                  {size} x {size}
                </button>
              ))}
            </div>
            {!isHost && (
              <span className="text-[10px] text-[#555555] mt-1 block">
                * 빙고 크기는 호스트만 변경할 수 있습니다.
              </span>
            )}
          </div>

          {/* Target Bingo Count select */}
          <div className="mt-2">
            <label className="block text-[11px] text-[#A0A0A0] font-sans font-semibold uppercase tracking-wider mb-2">
              목표 빙고 수 (Target Lines)
            </label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: maxTargets }, (_, i) => i + 1).map((val) => (
                <button
                  key={val}
                  disabled={!isHost}
                  onClick={() => handleTargetChange(val)}
                  className={`w-10 h-10 flex items-center justify-center text-xs font-mono font-bold rounded-lg border transition-all ${
                    targetBingo === val
                      ? 'bg-neonYellow text-black border-none font-extrabold'
                      : 'bg-black text-[#A0A0A0] border-burgundy/20 hover:border-burgundy/40'
                  } ${!isHost ? 'cursor-not-allowed opacity-80' : ''}`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Leave Room Button */}
        <button
          onClick={onLeaveRoom}
          className="flex items-center justify-center gap-2 w-full py-3 bg-black border border-zinc-800 text-[#A0A0A0] hover:text-white hover:bg-zinc-900 text-xs font-sans font-bold uppercase rounded-xl transition-colors mt-auto outline-none"
        >
          <LogOut className="w-4 h-4" />
          로비로 돌아가기
        </button>
      </div>

      {/* Right panel: Player list, state, and Game Trigger */}
      <div className="md:col-span-2 flex flex-col bg-[#111111] rounded-xl border border-burgundy/20 p-5 shadow-xl select-none">
        
        {/* Header summary info */}
        <div className="flex items-center justify-between border-b border-burgundy/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-neonYellow" />
            <h2 className="font-display font-black text-xl text-white uppercase tracking-wider">
              WAITING LOUNGE
            </h2>
          </div>
          <span className="font-mono text-xs text-[#A0A0A0] bg-black px-2.5 py-1 rounded-md border border-burgundy/10 font-bold">
            참가자: <span className="text-neonYellow">{players.length}</span>명
          </span>
        </div>

        {/* Players vertical grid */}
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[380px] pr-2 mb-6">
          {players.map((p) => {
            const isMe = p.id === myId;
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border ${
                  isMe
                    ? 'bg-burgundy/10 border-burgundy/40 shadow-inner'
                    : 'bg-black/40 border-burgundy/10'
                }`}
              >
                {/* Badge and Name */}
                <div className="flex items-center gap-3">
                  <span className="p-1 px-2 rounded font-mono text-[10px] font-bold bg-[#1E1E1E] border border-burgundy/10 uppercase">
                    {p.isHost ? (
                      <span className="text-neonYellow flex items-center gap-1">
                        <Shield className="w-3 h-3" /> HOST
                      </span>
                    ) : (
                      <span className="text-[#A0A0A0]">PLAYER</span>
                    )}
                  </span>
                  <span className={`font-sans text-sm font-bold ${isMe ? 'text-neonYellow' : 'text-white'}`}>
                    {p.name} {isMe && <span className="text-xs text-[#A0A0A0] font-normal">(나)</span>}
                  </span>
                </div>

                {/* Ready Status indicator */}
                <div>
                  {p.isHost ? (
                    <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-neonYellow">
                      <CheckCircle className="w-3.5 h-3.5 fill-[#1A1A12] text-neonYellow" /> READY
                    </span>
                  ) : p.isReady ? (
                    <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-green-400">
                      <CheckCircle className="w-3.5 h-3.5 fill-[#121A12] text-green-400" /> READY
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] font-semibold text-[#555555]">
                      WAITING
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Button Panel */}
        <div className="mt-auto pt-4 border-t border-burgundy/10">
          {isHost ? (
            <div className="space-y-2">
              <motion.button
                whileHover={isEveryoneReady ? { scale: 1.01 } : {}}
                whileTap={isEveryoneReady ? { scale: 0.99 } : {}}
                onClick={onStartGame}
                disabled={!isEveryoneReady}
                className={`w-full py-4 flex items-center justify-center gap-3 bg-neonYellow text-black font-display font-extrabold text-base tracking-widest uppercase rounded-xl border border-white/20 shadow-lg ${
                  isEveryoneReady
                    ? 'hover:bg-yellow-300 btn-neon-glow cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                } transition-all`}
              >
                <Play className="w-5 h-5 fill-current" />
                경기 시작 (START GAME)
              </motion.button>
              {!isEveryoneReady && (
                <p className="text-center text-xs text-[#A0A0A0] font-sans">
                  {players.length <= 1 ? "최소 2명 이상 참여해야 경기를 시작할 수 있습니다." : "모든 일반 참가자가 준비 완료되어야 시작 가능합니다."}
                </p>
              )}
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onToggleReady}
              className={`w-full py-4 flex items-center justify-center gap-3 font-display font-bold text-base tracking-wider uppercase rounded-xl transition-all border outline-none ${
                isMeReady
                  ? 'bg-green-600 hover:bg-green-500 text-white border-green-500 shadow-green-900/10'
                  : 'bg-burgundy hover:bg-burgundy-light text-white border-burgundy-light/40'
              }`}
            >
              {isMeReady ? (
                <>
                  <Check className="w-5 h-5" />
                  전투 대기 중 (READY 완료)
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  참가 대기 (READY ON)
                </>
              )}
            </motion.button>
          )}
        </div>

      </div>
    </div>
  );
}
