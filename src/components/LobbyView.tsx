/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, User, PlusCircle, ArrowRight, Video } from 'lucide-react';

interface LobbyViewProps {
  onHostRoom: (nickname: string) => void;
  onJoinRoom: (nickname: string, roomId: string) => void;
  isLoading: boolean;
  error: string | null;
}

export default function LobbyView({ onHostRoom, onJoinRoom, isLoading, error }: LobbyViewProps) {
  const [nickname, setNickname] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    onHostRoom(nickname.trim());
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !inputRoomId.trim()) return;
    onJoinRoom(nickname.trim(), inputRoomId.trim().toUpperCase());
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#111111] rounded-xl border border-burgundy/40 shadow-2xl overflow-hidden burgundy-shadow">
      {/* Visual Header */}
      <div className="relative py-8 px-6 bg-gradient-to-b from-burgundy-dark to-[#111111] text-center border-b border-burgundy/30">
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-neonYellow/20">
          <span className="w-2 h-2 rounded-full bg-neonYellow animate-pulse" />
          <span className="font-mono text-[9px] text-[#A0A0A0] tracking-wider uppercase">P2P Realtime Node</span>
        </div>
        
        {/* Animated logo matching the rotating header design */}
        <div className="flex items-center justify-center gap-2 mb-2 select-none">
          <div className="bg-neonYellow px-2.5 py-1 rounded-sm rotate-2">
            <span className="text-black font-black text-xs italic leading-none block">SPEED</span>
          </div>
          <span className="font-display font-black text-2xl text-white tracking-widest uppercase italic">
            BINGO
          </span>
        </div>
        
        <p className="mt-2.5 font-sans text-xs text-[#A0A0A0] tracking-wide">
          스릴 만점 반응속도 기반의 초고속 실시간 멀티플레이 빙고
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-burgundy/20">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-4 text-sm font-display font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'create'
              ? 'text-neonYellow border-b-2 border-neonYellow bg-black/40'
              : 'text-[#A0A0A0] hover:text-white hover:bg-[#1A1A1A]'
          }`}
        >
          방 만들기 (Host)
        </button>
        <button
          onClick={() => setActiveTab('join')}
          className={`flex-1 py-4 text-sm font-display font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'join'
              ? 'text-neonYellow border-b-2 border-neonYellow bg-black/40'
              : 'text-[#A0A0A0] hover:text-white hover:bg-[#1A1A1A]'
          }`}
        >
          방 참가하기 (Client)
        </button>
      </div>

      {/* Form Area */}
      <div className="p-6 bg-[#111111]">
        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/40 rounded-lg text-red-400 text-xs font-sans text-center">
            {error}
          </div>
        )}

        {/* Username input (Common across both tabs) */}
        <div className="mb-5">
          <label className="block font-sans text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider mb-2">
            플레이어 닉네임
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#A0A0A0]">
              <User className="w-4 h-4" />
            </span>
            <input
              type="text"
              required
              maxLength={10}
              placeholder="최대 10글자 입력"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black border border-burgundy/30 rounded-xl font-sans text-white placeholder-[#555555] text-sm focus:outline-none focus:border-neonYellow focus:ring-1 focus:ring-neonYellow/20 transition-all"
            />
          </div>
        </div>

        {activeTab === 'create' ? (
          <form onSubmit={handleCreate}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || !nickname.trim()}
              className={`w-full flex items-center justify-center gap-2 py-3.5 bg-neonYellow text-black font-display font-extrabold text-sm uppercase rounded-xl border border-white/20 shadow-lg ${
                isLoading || !nickname.trim()
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-yellow-300 btn-neon-glow'
              } transition-all`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  방을 개설하는 중...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  새로운 빙고방 개설
                </>
              )}
            </motion.button>
          </form>
        ) : (
          <form onSubmit={handleJoin}>
            <div className="mb-5">
              <label className="block font-sans text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider mb-2">
                빙고방 코드 (Room ID)
              </label>
              <input
                type="text"
                required
                placeholder="예: SBA28F"
                maxLength={8}
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-burgundy/30 rounded-xl font-mono text-center text-white font-bold select-all placeholder-[#555555] text-sm tracking-widest uppercase focus:outline-none focus:border-neonYellow focus:ring-1 focus:ring-neonYellow/20 transition-all"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || !nickname.trim() || !inputRoomId.trim()}
              className={`w-full flex items-center justify-center gap-2 py-3.5 bg-burgundy hover:bg-burgundy-light text-white font-display font-bold text-sm uppercase rounded-xl border border-burgundy-light/40 shadow-lg ${
                isLoading || !nickname.trim() || !inputRoomId.trim()
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:shadow-red-900/20'
              } transition-all`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  연결을 요청하는 중...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  입장하기
                </>
              )}
            </motion.button>
          </form>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-6 py-4 bg-black border-t border-burgundy/10 text-center select-none">
        <span className="font-sans text-[10px] text-[#555555] tracking-wider uppercase">
          Client-to-Client Peer Connected &bull; Serverless eSports
        </span>
      </div>
    </div>
  );
}
