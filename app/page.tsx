"use client";

import { useState, useEffect } from "react";

// 1. 관리할 친구들 목록
const FRIENDS_LIST = [
  { name: "3톤 트랙터", tag: "KR1" },
  { name: "친구1", tag: "KR1" },
  { name: "친구2", tag: "KR1" },
  { name: "친구3", tag: "KR1" },
  { name: "친구4", tag: "KR1" },
];

const MAPS = ["어비스", "로터스", "선셋", "헤이븐", "아이스박스", "바인드", "어센트"];

export default function Home() {
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [result, setResult] = useState<{ teamA: any[], teamB: any[], map: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const results = await Promise.all(
          FRIENDS_LIST.map(async (f) => {
            try {
              const res = await fetch(`https://api.henrikdev.xyz/valorant/v1/mmr/kr/${encodeURIComponent(f.name)}/${f.tag}`, {
                headers: { "Authorization": process.env.NEXT_PUBLIC_VALORANT_API_KEY || "" }
              });
              const json = await res.json();
              return json.status === 200 
                ? { ...json.data, id: `${f.name}#${f.tag}`, elo: json.data.elo || 0, error: false } 
                : { name: f.name, tag: f.tag, error: true, id: `${f.name}#${f.tag}`, elo: 0 };
            } catch (e) {
              return { name: f.name, tag: f.tag, error: true, id: `${f.name}#${f.tag}`, elo: 0 };
            }
          })
        );
        setPlayers(results);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const generateMatch = () => {
    const selected = players.filter(p => selectedIds.includes(p.id));
    if (selected.length < 2) return alert("최소 2명 이상 선택해주세요!");

    const sorted = [...selected].sort((a, b) => b.elo - a.elo);
    const teamA: any[] = [];
    const teamB: any[] = [];
    sorted.forEach((p, i) => (i % 2 === 0 ? teamA.push(p) : teamB.push(p)));

    const randomMap = MAPS[Math.floor(Math.random() * MAPS.length)];
    setResult({ teamA, teamB, map: randomMap });
  };

  const getAvgElo = (team: any[]) => {
    if (team.length === 0) return 0;
    return Math.floor(team.reduce((acc, p) => acc + p.elo, 0) / team.length);
  };

  if (loading) return <div className="min-h-screen bg-[#0f1923] text-white flex items-center justify-center font-black italic tracking-widest">SYNCING DATA...</div>;

  return (
    <main className="min-h-screen p-6 md:p-12 bg-[#0f1923] text-white">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-800 pb-10">
          <div>
            <h1 className="text-7xl font-black text-[#ff4655] italic uppercase tracking-tighter leading-none">SCRIM</h1>
            <p className="text-gray-500 mt-2 tracking-[0.3em] uppercase text-[10px]">Balanced Matchmaking System</p>
          </div>
          <button 
            onClick={generateMatch}
            className="w-full md:w-auto bg-[#ff4655] hover:bg-white hover:text-[#ff4655] text-white font-black py-5 px-12 transition-all border-2 border-[#ff4655] shadow-[6px_6px_0px_0px_rgba(255,70,85,0.3)]"
          >
            GENERATE MATCH
          </button>
        </header>

        {/* 2번: 전력 분석 대시보드 */}
        {result && (
          <div className="mb-12 animate-in fade-in zoom-in duration-500">
            <div className="bg-[#1f2933] p-6 flex items-center justify-around border-y border-gray-800 shadow-2xl relative overflow-hidden">
              {/* 배경 텍스트 장식 */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 select-none pointer-events-none">
                <span className="text-9xl font-black italic">VERSUS</span>
              </div>
              
              <div className="text-center z-10">
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Team Alpha Avg</p>
                <p className="text-4xl font-black text-blue-400 italic">{getAvgElo(result.teamA)}</p>
              </div>
              
              <div className="flex flex-col items-center z-10">
                <span className="text-[10px] font-bold text-gray-500 uppercase mb-2">Selected Map</span>
                <div className="bg-[#ff4655] px-6 py-2 skew-x-[-15deg]">
                  <p className="text-xl font-black text-white italic skew-x-[15deg]">{result.map}</p>
                </div>
                <p className="text-[10px] font-bold text-white mt-2">Gap: {Math.abs(getAvgElo(result.teamA) - getAvgElo(result.teamB))} pts</p>
              </div>

              <div className="text-center z-10">
                <p className="text-[10px] text-[#ff4655] font-bold uppercase tracking-widest mb-1">Team Bravo Avg</p>
                <p className="text-4xl font-black text-[#ff4655] italic">{getAvgElo(result.teamB)}</p>
              </div>
            </div>
            
            {/* 팀 멤버 리스트 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-blue-900/10 p-4 border-l-2 border-blue-500">
                {result.teamA.map(p => <div key={p.id} className="text-sm py-1">{p.name} <span className="text-[10px] text-gray-500">{p.currenttierpatched}</span></div>)}
              </div>
              <div className="bg-red-900/10 p-4 border-r-2 border-[#ff4655] text-right">
                {result.teamB.map(p => <div key={p.id} className="text-sm py-1"><span className="text-[10px] text-gray-500">{p.currenttierpatched}</span> {p.name}</div>)}
              </div>
            </div>
          </div>
        )}

        {/* 유저 그리드 - 1번: 게이지 바 적용 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {players.map((player) => (
            <div 
              key={player.id}
              onClick={() => toggleSelect(player.id)}
              className={`group cursor-pointer p-5 border-2 transition-all relative ${
                selectedIds.includes(player.id) ? "border-[#ff4655] bg-[#1f2933]" : "border-gray-900 bg-[#171f27] opacity-40 grayscale"
              }`}
            >
              <div className="relative z-10">
                <p className="text-[10px] text-gray-500 font-mono">#{player.tag}</p>
                <h2 className="text-lg font-black truncate">{player.name}</h2>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-tighter">
                    <span className="text-gray-500">{player.currenttierpatched || "UNRANKED"}</span>
                    <span>{player.elo || 0} pts</span>
                  </div>
                  {/* 티어 게이지 바 */}
                  <div className="w-full bg-gray-800 h-1">
                    <div 
                      className="bg-[#ff4655] h-full transition-all duration-700" 
                      style={{ width: `${player.error ? 0 : (player.ranking_in_tier || 0)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <img src={player.images?.small} className="w-8 h-8" alt="" />
                  {selectedIds.includes(player.id) && (
                    <span className="text-[8px] font-black bg-[#ff4655] px-1 italic">SELECTED</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}