/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Shuffle, Check, ArrowRight } from 'lucide-react';
import { RouletteState, Player } from '../types';

interface RouletteViewProps {
  roulette: RouletteState;
  players: Player[];
  myId: string;
  isHost: boolean;
  onSubmitTopic: (topic: string) => void;
}

export default function RouletteView({
  roulette,
  players,
  myId,
  isHost,
  onSubmitTopic,
}: RouletteViewProps) {
  const [isSpinningComplete, setIsSpinningComplete] = useState(false);
  const [topicInput, setTopicInput] = useState('');
  const [topicError, setTopicError] = useState('');

  const { isSpinning, winnerId, candidateIds, finalIndex } = roulette;
  const itemHeight = 60; // 60px per item

  // Find Winner info
  const winnerPlayer = players.find((p) => p.id === winnerId);
  const isMeWinner = winnerId === myId;

  // Sync the spinning completion locally based on standard 3.5s transition time
  useEffect(() => {
    if (isSpinning) {
      setIsSpinningComplete(false);
      const timer = setTimeout(() => {
        setIsSpinningComplete(true);
      }, 3800); // 3.8s to be safe after the css duration completes
      return () => clearTimeout(timer);
    }
  }, [isSpinning, winnerId]);

  // Handle topic confirm
  const handleTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim()) {
      setTopicError('주제를 입력해주세요.');
      return;
    }
    onSubmitTopic(topicInput.trim());
  };

  // Recommended topics
  const recommendedTopics = ['동물', '음식', '영화', '게임', '디저트', '스포츠', '국가', '직업', '과일', '브랜드'];

  return (
    <div className="w-full max-w-lg mx-auto bg-[#111111] p-6 rounded-xl border border-burgundy/40 shadow-2xl text-center burgundy-shadow select-none">
      <div className="mb-6">
        <span className="p-1 px-3 bg-burgundy/30 text-neonYellow border border-neonYellow/20 rounded-full font-mono text-xs uppercase font-extrabold tracking-widest animate-pulse">
          Phase 1: Topic Selector Selection
        </span>
        <h2 className="font-display font-black text-3xl text-white mt-3 uppercase tracking-wider italic">
          슬롯머신 주제 권한 추첨
        </h2>
        <p className="text-[#A0A0A0] text-xs mt-1.5 font-sans">
          슬롯머신이 가장 공정하게 플레이어 1명을 추첨합니다.
        </p>
      </div>

      {/* Vertical Reel Slot Machine */}
      <div className="relative h-[72px] overflow-hidden border-2 border-neonYellow/35 bg-[#0A0A0A] rounded-xl max-w-xs mx-auto flex items-center justify-center shadow-lg border-neon-glow">
        
        {/* Neon Center Pointer indicators */}
        <div className="absolute inset-y-0 left-2 flex items-center z-20 pointer-events-none text-neonYellow">
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          >
            &gt;
          </motion.div>
        </div>
        <div className="absolute inset-y-0 right-2 flex items-center z-20 pointer-events-none text-neonYellow">
          <motion.div
            animate={{ x: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          >
            &lt;
          </motion.div>
        </div>

        {/* Shading covers (adds 3D effect to reel) */}
        <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />

        {/* Spinning reel wheel wrapper */}
        <div
          style={{
            transform: isSpinningComplete
              ? `translateY(-${finalIndex * itemHeight}px)`
              : isSpinning
              ? `translateY(-${(candidateIds.length - 2) * itemHeight}px)` // Spin upwards initially
              : 'translateY(0px)',
            transition: isSpinning
              ? 'transform 3.5s cubic-bezier(0.1, 0.8, 0.25, 1)'
              : 'none',
          }}
          className="w-full text-center"
        >
          {candidateIds.map((pid, idx) => {
            const player = players.find((p) => p.id === pid);
            const name = player ? player.name : 'Unknown Player';
            const isWinnerItem = idx === finalIndex;

            return (
              <div
                key={idx}
                style={{ height: `${itemHeight}px` }}
                className={`flex items-center justify-center font-display font-black text-lg tracking-wider transition-colors duration-300 ${
                  isWinnerItem && isSpinningComplete
                    ? 'text-neonYellow text-xl'
                    : 'text-[#A0A0A0]/70'
                }`}
              >
                {name}
              </div>
            );
          })}
        </div>
      </div>

      {/* Output screen after spinning completed */}
      <div className="mt-8">
        <AnimatePresence mode="wait">
          {!isSpinningComplete ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-3 text-sm text-[#A0A0A0] font-sans font-bold"
            >
              <Shuffle className="w-4 h-4 text-neonYellow animate-spin" />
              룰렛이 세로 회전하고 있습니다...
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="space-y-6"
            >
              {/* Spinning Winner presentation card */}
              <div className="p-4 bg-burgundy/10 border border-burgundy/30 rounded-xl max-w-sm mx-auto">
                <div className="flex items-center justify-center gap-2 text-neonYellow mb-1 font-mono text-xs font-black">
                  <Trophy className="w-4 h-4" /> WINNER ELECTED
                </div>
                <h3 className="text-xl font-display font-black text-white">
                  {winnerPlayer ? winnerPlayer.name : 'Unknown Player'}
                </h3>
                <p className="text-xs text-[#A0A0A0] mt-1">빙고판의 제시 주제를 선정할 자격을 확보했습니다!</p>
              </div>

              {/* Action layout based on winner ownership */}
              {isMeWinner ? (
                <div className="p-5 bg-black border border-neonYellow/20 rounded-xl space-y-4 text-left">
                  <div className="flex items-center gap-1.5 text-neonYellow font-mono text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" /> SUBJECT PANEL
                  </div>
                  <h4 className="text-sm text-white font-sans font-extrabold">빙고 주제를 입력해 주세요.</h4>
                  
                  <form onSubmit={handleTopicSubmit} className="space-y-4">
                    <input
                      type="text"
                      maxLength={15}
                      required
                      placeholder="예시: 동물, 과일, 음식, 아이돌 이름 등"
                      value={topicInput}
                      onChange={(e) => {
                        setTopicInput(e.target.value);
                        setTopicError('');
                      }}
                      className="w-full px-4 py-3 bg-[#0A0A0A] border border-burgundy/30 rounded-lg text-sm text-white focus:outline-none focus:border-neonYellow transition-colors"
                    />
                    {topicError && <p className="text-red-500 text-xs">{topicError}</p>}

                    {/* Subject Pill Recommendations */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-[#A0A0A0] font-sans uppercase font-bold">추천 주제 리스트</span>
                      <div className="flex flex-wrap gap-1.5">
                        {recommendedTopics.map((rec) => (
                          <button
                            key={rec}
                            type="button"
                            onClick={() => {
                              setTopicInput(rec);
                              setTopicError('');
                            }}
                            className="bg-burgundy/10 text-[#A0A0A0] hover:text-neonYellow hover:border-neonYellow/30 border border-burgundy/20 text-[11px] px-2.5 py-1 rounded-full transition-all"
                          >
                            {rec}
                          </button>
                        ))}
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full font-display font-bold text-xs uppercase tracking-wider py-3 bg-neonYellow text-black rounded-lg cursor-pointer flex items-center justify-center gap-1 bg-yellow-300 btn-neon-glow transition-all"
                    >
                      <Check className="w-4 h-4" /> 주제 확정 적용
                    </motion.button>
                  </form>
                </div>
              ) : (
                <div className="items-center justify-center flex flex-col gap-2 p-5 bg-black border border-burgundy/10 rounded-xl max-w-sm mx-auto">
                  <div className="w-5 h-5 border-2 border-neonYellow border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-[#A0A0A0] font-sans">
                    현재 <span className="text-white font-bold">{winnerPlayer ? winnerPlayer.name : '홍길동'}</span>님이
                  </p>
                  <p className="text-xs text-[#A0A0A0] font-sans">
                    어떤 주제를 선택할지 고르고 있습니다. 잠시만 대기해주세요...
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
