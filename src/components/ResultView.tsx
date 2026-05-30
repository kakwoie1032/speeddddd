/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Award, RefreshCcw, LogOut, TrendingUp, Grid, ShieldAlert, Sparkles, Trophy } from 'lucide-react';
import { Ranking, Player } from '../types';

interface ResultViewProps {
  rankings: Ranking[];
  players: Player[];
  myId: string;
  isHost: boolean;
  onPlayAgain: () => void;
  onLeaveRoom: () => void;
}

export default function ResultView({
  rankings,
  players,
  myId,
  isHost,
  onPlayAgain,
  onLeaveRoom,
}: ResultViewProps) {
  const [selectedRankedBoardId, setSelectedRankedBoardId] = useState<string>(
    rankings[0]?.playerId || ''
  );

  // Find selected board to display
  const activeRanking = rankings.find((r) => r.playerId === selectedRankedBoardId);
  const activeBoard = activeRanking?.board;

  // Render grid helper
  const getGridColsClass = (size: number) => {
    if (size === 3) return 'grid-cols-3';
    if (size === 4) return 'grid-cols-4';
    return 'grid-cols-5';
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 select-none">
      
      {/* Title Header */}
      <div className="text-center mb-8">
        <span className="p-1.5 px-3 bg-[#5C061C]/50 border border-burgundy/40 text-neonYellow rounded-full font-mono text-xs font-black tracking-widest uppercase animate-pulse">
          MATCH FINISHED &bull; 결과 발표
        </span>
        <h1 className="font-display font-black text-4xl text-white text-neon-glow mt-3 italic uppercase tracking-wider">
          경기 종합 결과 리포트
        </h1>
        <p className="text-xs text-[#A0A0A0] font-sans mt-1">
          목표 빙고 줄 수를 모두 활성화하여 승리한 플레이어 명단과 경기 통계입니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle panel: Placements and Statistics */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Placements Cards */}
          <div className="bg-[#111111] border border-burgundy/30 p-5 rounded-xl shadow-xl burgundy-shadow">
            <h3 className="font-display font-black text-lg text-white mb-4 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-5 h-5 text-neonYellow" /> 최종 순위 포디움
            </h3>

            {rankings.length === 0 ? (
              <p className="text-sm text-[#A0A0A0] italic text-center py-6">달성자가 없습니다.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rankings.slice(0, 3).map((r) => {
                  const placeName = r.rank === 1 ? '1st Place' : r.rank === 2 ? '2nd Place' : '3rd Place';
                  const placeColor =
                    r.rank === 1
                      ? 'border-neonYellow bg-yellow-400/5 text-neonYellow'
                      : r.rank === 2
                      ? 'border-gray-400 bg-gray-400/5 text-gray-300'
                      : 'border-amber-700 bg-amber-700/5 text-amber-500';

                  return (
                    <div
                      key={r.playerId}
                      onClick={() => setSelectedRankedBoardId(r.playerId)}
                      className={`cursor-pointer p-4 rounded-xl border text-center flex flex-col justify-between transition-all hover:scale-[1.02] ${placeColor} ${
                        selectedRankedBoardId === r.playerId
                          ? 'ring-2 ring-neonYellow ring-offset-2 ring-offset-black'
                          : ''
                      }`}
                    >
                      <div>
                        <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest block opacity-75">
                          {placeName}
                        </span>
                        <h4 className="text-lg font-display font-black text-white mt-1 break-all truncate">
                          {r.playerName}
                        </h4>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 font-mono text-xs">
                        <p className="text-[#A0A0A0] text-[10px] uppercase font-semibold">빙고 완성 시간</p>
                        <p className="font-extrabold text-white mt-0.5">{r.completionTime}초 소요</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Statistics panel */}
          <div className="bg-[#111111] border border-burgundy/15 p-5 rounded-xl shadow-xl">
            <h3 className="font-display font-black text-sm text-[#A0A0A0] mb-4 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-neonYellow" /> 경기 상세 성과 통계
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs text-[#A0A0A0]">
                <thead>
                  <tr className="border-b border-burgundy/10 text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">
                    <th className="pb-3 text-center w-12">순위</th>
                    <th className="pb-3 pl-2">플레이어</th>
                    <th className="pb-3 text-center">클릭 승리 수</th>
                    <th className="pb-3 text-center">키워드 제출 수</th>
                    <th className="pb-3 text-center">빙고 달성 시간</th>
                    <th className="pb-3 text-center">최종 빙고 수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-burgundy/5 text-white">
                  {players.map((p, idx) => {
                    const r = rankings.find((rank) => rank.playerId === p.id);
                    const rankNum = r ? r.rank : '탈락';

                    return (
                      <tr key={p.id} className="hover:bg-burgundy/5 transition-colors">
                        <td className="py-3 text-center font-mono font-bold text-neonYellow">{rankNum}</td>
                        <td className="py-3 pl-2 font-bold break-all max-w-[120px]">{p.name} {p.id === myId && <span className="text-[#A0A0A0] font-normal text-[10px]">(나)</span>}</td>
                        <td className="py-3 text-center font-mono">{p.stats.clickWins}회</td>
                        <td className="py-3 text-center font-mono">{p.stats.submittedKeywords}개</td>
                        <td className="py-3 text-center font-mono">{p.stats.bingoTime !== null ? `${p.stats.bingoTime}초` : '미달성'}</td>
                        <td className="py-3 text-center font-mono font-bold text-neonYellow">{p.stats.finalBingoCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right side panel: Selected Winner's Bingo Board Viewer */}
        <div className="flex flex-col bg-[#111111] border border-burgundy/30 p-5 rounded-xl shadow-xl select-none burgundy-shadow">
          <div className="border-b border-burgundy/10 pb-3 mb-4">
            <h3 className="font-display font-black text-sm text-neonYellow uppercase tracking-wider flex items-center gap-1.5">
              <Grid className="w-4 h-4" /> 결과 분석용 빙고판
            </h3>
            {activeRanking && (
              <p className="text-xs text-[#A0A0A0] font-sans mt-1">
                현재 <span className="text-white font-black">{activeRanking.playerName}</span>님의 빙고판 레이아웃
              </p>
            )}
          </div>

          {activeBoard ? (
            <div className="flex-1 flex flex-col justify-center">
              <div className={`grid ${getGridColsClass(activeBoard.gridSize)} gap-2 max-w-sm mx-auto w-full`}>
                {activeBoard.cells.map((cell) => (
                  <div
                    key={cell.id}
                    className={`aspect-square border rounded-lg p-1.5 flex flex-col justify-between text-center ${
                      cell.isMarked
                        ? 'bg-burgundy/20 border-neonYellow text-neonYellow text-neon-glow'
                        : 'bg-[#0E0E0E] border-burgundy/15 text-zinc-500'
                    }`}
                  >
                    <span className="font-mono text-[8px] text-[#444444] font-bold">
                      {(cell.id + 1).toString().padStart(2, '0')}
                    </span>
                    <span
                      className={`text-[9px] md:text-[10px] font-sans font-black break-all line-clamp-2 px-0.5 mb-1 ${
                        cell.isMarked ? 'line-through text-neonYellow' : 'text-zinc-300'
                      }`}
                    >
                      {cell.keyword}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 p-3 bg-burgundy/10 border border-burgundy/25 rounded-xl text-center">
                <span className="font-mono text-xs font-semibold text-white">
                  최종 달성 빙고 라인: <span className="text-neonYellow font-black text-sm">{activeBoard.completedBingoCount}줄</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 my-auto">
              <p className="text-xs text-[#555555] font-sans">
                대좌 포디움 카드를 클릭하면 해당하는 플레이어의 완성 빙고판 상황이 여기에 상세 분석되어 렌더링됩니다.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Persistent Restart control buttons - bottom right custom segment */}
      <div className="mt-8 flex items-center justify-end gap-3 max-w-sm ml-auto">
        {isHost ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPlayAgain}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-400 font-display font-extrabold text-xs text-black uppercase rounded-xl transition-all shadow-lg hover:shadow-green-500/10 cursor-pointer outline-none"
          >
            <RefreshCcw className="w-4 h-4" />
            재참가 (PLAY AGAIN)
          </motion.button>
        ) : (
          <div className="flex-1 p-2 bg-burgundy/10 border border-burgundy/30 rounded-xl text-center">
            <span className="text-[10px] font-sans text-neonYellow font-semibold animate-pulse block">
              호스트가 재시작 버튼을 누르면 같은 방에서 즉시 한판 더 가능합니다.
            </span>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLeaveRoom}
          className="px-6 py-3 bg-burgundy hover:bg-burgundy-light font-display font-bold text-xs text-white uppercase rounded-xl border border-burgundy-light/40 transition-all cursor-pointer outline-none"
        >
          <LogOut className="w-4 h-4" />
        </motion.button>
      </div>

    </div>
  );
}
