/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, HelpCircle, Check, Grid, Flame, Lightbulb } from 'lucide-react';
import { BingoCell, Player } from '../types';

interface WritingViewProps {
  topic: string;
  gridSize: number;
  writingTimeRemaining: number;
  players: Player[];
  myId: string;
  onCompleteBoard: (cells: BingoCell[]) => void;
}

export default function WritingView({
  topic,
  gridSize,
  writingTimeRemaining,
  players,
  myId,
  onCompleteBoard,
}: WritingViewProps) {
  const totalCells = gridSize * gridSize;
  const [cells, setCells] = useState<string[]>(Array(totalCells).fill(''));
  const [isSubmitted, setIsSubmitted] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Format timer
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCellChange = (index: number, val: string) => {
    if (isSubmitted) return;
    const nextCells = [...cells];
    nextCells[index] = val;
    setCells(nextCells);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Auto focus next cell
      const nextIndex = index + 1;
      if (nextIndex < totalCells && inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex]?.focus();
      }
    }
  };

  const checkAllFilled = () => {
    return cells.every((text) => text.trim().length > 0);
  };

  const handleSubmit = () => {
    if (!checkAllFilled() || isSubmitted) return;

    const finalCells: BingoCell[] = cells.map((keyword, index) => ({
      id: index,
      keyword: keyword.trim(),
      isMarked: false,
    }));

    setIsSubmitted(true);
    onCompleteBoard(finalCells);
  };

  // Helper dynamic vocabulary suggestions for specific topics
  const getSuggestions = (t: string) => {
    const topicMap: Record<string, string[]> = {
      동물: ['강아지', '고양이', '사자', '호랑이', '토끼', '기린', '코끼리', '여우', '늑대', '곰', '판다', '독수리', '돌고래', '펭귄', '다람쥐', '악어', '거북이', '뱀', '치타', '하마', '원숭이', '부엉이', '얼룩말', '사슴', '낙타'],
      음식: ['김치찌개', '짜장면', '피자', '치킨', '삼겹살', '파스타', '떡볶이', '초밥', '냉면', '부대찌개', '비빔밥', '김밥', '햄버거', '라면', '돈까스', '칼국수', '설렁탕', '순대국', '제육볶음', '감자탕', '보쌈', '족발', '샌드위치', '스테이크', '샐러드'],
      나라: ['한국', '미국', '일본', '중국', '영국', '프랑스', '독일', '이탈리아', '캐나다', '호주', '브라질', '스페인', '러시아', '베트남', '태국', '인도', '멕시코', '이집트', '스위스', '네덜란드', '그리스', '싱가포르', '아르헨티나', '터키', '스웨덴'],
      게임: ['롤(LoL)', '메이플스토리', '오버워치', '배틀그라운드', '마인크래프트', '발로란트', '서든어택', '디아블로', '스타크래프트', '던전앤파이터', '로스트아크', '피파온라인', '테일즈런너', '카트라이더', '크레이지아케이드', '젤다의전설', '포켓몬스터', '철권', '피크민', '동물의숲', '이터널리턴', '리니지', '원신', '쿠키런', '어몽어스'],
      스포츠: ['축구', '야구', '농구', '배구', '테니스', '골프', '수영', '태권도', '육상', '탁구', '배드민턴', '양궁', '사격', '유도', '복싱', '사이클', '피겨스케이팅', '쇼트트랙', '스노보드', '스키', '핸드볼', '체조', '역도', '펜싱', '볼링'],
    };

    const key = Object.keys(topicMap).find((k) => t.includes(k) || k.includes(t));
    return key ? topicMap[key] : ['영화', '아이돌', '지하철역', '과일', '브랜드명', '배우명', '대학교', 'IT회사', '가전제품', '학용품', '화장품'].includes(t) ? [] : ['키워드1', '키워드2', '키워드3', '키워드4', '키워드5'];
  };

  const suggestions = getSuggestions(topic);

  const fillRandomly = () => {
    if (suggestions.length === 0 || isSubmitted) return;
    const shuffled = [...suggestions].sort(() => 0.5 - Math.random());
    const newCells = [...cells];
    for (let i = 0; i < totalCells; i++) {
      if (shuffled[i]) {
        newCells[i] = shuffled[i];
      }
    }
    setCells(newCells);
  };

  // Grid styling helper based on grid size
  const getGridColsClass = () => {
    if (gridSize === 3) return 'grid-cols-3';
    if (gridSize === 4) return 'grid-cols-4';
    return 'grid-cols-5';
  };

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 p-4 select-none">
      
      {/* Central panel: Topic and Bingo grid entry */}
      <div className="lg:col-span-3 flex flex-col bg-[#111111] p-6 rounded-xl border border-burgundy/40 shadow-xl burgundy-shadow">
        
        {/* Step Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-burgundy/10 pb-4 mb-4 gap-3">
          <div>
            <span className="text-[10px] bg-[#1E1E1E] border border-burgundy/20 px-2.5 py-1 text-neonYellow rounded-md font-mono font-bold tracking-wider uppercase">
              Phase 3: Populate Bingo Board
            </span>
            <h2 className="font-display font-black text-2xl text-white tracking-wide uppercase mt-1.5 flex items-center gap-2">
              <Grid className="w-5 h-5 text-neonYellow" /> {gridSize}x{gridSize} 빙고판 작성 시간
            </h2>
            <p className="text-xs text-[#A0A0A0] font-sans mt-0.5">
              지정된 주제에 맞는 단어들로 {totalCells}칸을 빠짐없이 채워주세요. (줄바꿈/띄어쓰기 생략 추천)
            </p>
          </div>

          {/* Sync Time counter */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-burgundy/15 border border-burgundy/30 rounded-xl max-w-xs justify-center md:self-center select-none">
            <Clock className="w-4 h-4 text-neonYellow animate-pulse" />
            <span className="font-mono text-base font-black text-white tracking-widest">
              {formatTime(writingTimeRemaining)}
            </span>
          </div>
        </div>

        {/* Big Neon Topic Indicator */}
        <div className="mb-6 p-4 bg-gradient-to-r from-burgundy-dark to-black border border-burgundy/40 rounded-xl text-center shadow-lg">
          <span className="font-sans text-[10px] text-neonYellow font-extrabold tracking-widest uppercase">지정된 단어 주제</span>
          <h3 className="font-display font-black text-3xl text-white text-neon-glow mt-1 font-sans">
            {topic}
          </h3>
        </div>

        {/* Main Grid entry board */}
        <div className={`grid ${getGridColsClass()} gap-2.5 mb-6`}>
          {Array.from({ length: totalCells }).map((_, index) => (
            <div
              key={index}
              className={`relative bg-[#0F0F0F] border rounded-xl overflow-hidden aspect-square flex flex-col justify-between p-2 focus-within:border-neonYellow focus-within:ring-2 focus-within:ring-neonYellow/10 transition-all ${
                isSubmitted ? 'opacity-85 border-burgundy/10' : 'border-burgundy/20'
              }`}
            >
              <span className="font-mono text-[9px] text-[#555555] font-extrabold top-1.5 left-2 select-none">
                {(index + 1).toString().padStart(2, '0')}
              </span>
              <input
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                disabled={isSubmitted}
                maxLength={10}
                placeholder="단어 입력"
                value={cells[index]}
                onChange={(e) => handleCellChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-full mt-auto mb-1 text-center bg-transparent border-none text-white text-xs md:text-sm font-sans font-bold placeholder-[#333333] focus:outline-none focus:ring-0 outline-none"
              />
            </div>
          ))}
        </div>

        {/* Action button cluster */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-auto">
          {suggestions.length > 0 && !isSubmitted && (
            <button
              onClick={fillRandomly}
              className="w-full sm:w-auto px-5 py-3 border border-zinc-700 bg-zinc-950 text-xs font-sans font-bold hover:text-white text-[#A0A0A0] hover:bg-zinc-900 rounded-xl flex items-center justify-center gap-1.5 uppercase transition-all select-none outline-none"
            >
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              자동 채우기 (치트)
            </button>
          )}

          <motion.button
            whileHover={checkAllFilled() && !isSubmitted ? { scale: 1.01 } : {}}
            whileTap={checkAllFilled() && !isSubmitted ? { scale: 0.99 } : {}}
            onClick={handleSubmit}
            disabled={!checkAllFilled() || isSubmitted}
            className={`w-full sm:w-auto sm:ml-auto px-8 py-3.5 flex items-center justify-center gap-2 font-display font-extrabold text-sm uppercase rounded-xl border border-white/10 shadow-lg tracking-wider ${
              checkAllFilled() && !isSubmitted
                ? 'bg-neonYellow text-black cursor-pointer hover:bg-yellow-300 btn-neon-glow'
                : isSubmitted
                ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed border-none'
                : 'bg-zinc-950 text-[#555555] cursor-not-allowed border-zinc-900'
            } transition-all`}
          >
            <Check className="w-4 h-4" />
            {isSubmitted ? '빙고 보드 등록 완료' : '내 빙고판 제출하기'}
          </motion.button>
        </div>

      </div>

      {/* Right panel: Sidebar layout with participants and tips */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        
        {/* Player readiness lists */}
        <div className="bg-[#111111] rounded-xl border border-burgundy/20 p-5 shadow-xl flex flex-col">
          <div className="border-b border-burgundy/10 pb-3 mb-3">
            <h4 className="font-display font-bold text-sm text-white">동기화 대기 상황</h4>
          </div>

          <div className="space-y-2">
            {players.map((p) => {
              const hasCompleted = p.isReady || p.stats.finalBingoCount > 0; // Host or players who finalized their board represent complete
              // Wait, since 'writing' state has no ready state, players who are ready or locked boards are complete.
              // Let's use custom indicator if needed, but for now we can just show player name
              return (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-burgundy/5 text-xs">
                  <span className="font-sans font-bold text-[#A0A0A0]">{p.name}</span>
                  {p.id === myId && isSubmitted ? (
                    <span className="text-green-400 font-mono text-[10px] font-bold uppercase">SUBMITTED</span>
                  ) : p.id === myId ? (
                    <span className="text-neonYellow font-mono text-[10px] font-medium tracking-wide">WRITING</span>
                  ) : (
                    <span className="text-[#555555] font-mono text-[10px]">입력 중</span>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-[#555555] mt-4 leading-normal">
            모든 플레이어가 자신의 빙고판 작성을 완료하여 제출해야 다음 라운드로 자동으로 진행됩니다.
          </p>
        </div>

        {/* Word suggestions popup helper */}
        {suggestions.length > 0 && (
          <div className="bg-black/40 rounded-xl border border-burgundy/10 p-5 shadow-xl flex flex-col">
            <h4 className="font-display font-bold text-xs text-neonYellow mb-2 uppercase tracking-wider flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-400" /> 추천단어 목록
            </h4>
            <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
              {suggestions.map((word) => (
                <span
                  key={word}
                  className="bg-[#121212] border border-burgundy/5 text-[10px] text-zinc-400 px-2 py-0.5 rounded cursor-pointer hover:text-white hover:border-burgundy/20 transition-all select-all font-sans"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
