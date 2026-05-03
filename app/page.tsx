"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase 클라이언트 설정
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MAPS = ["어비스", "로터스", "선셋", "헤이븐", "아이스박스", "바인드", "어센트"];

export default function Home() {
  const [players, setPlayers] = useState<any>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [result, setResult] = useState<{ teamA: any[], teamB: any[], map: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // 닉네임 입력을 위한 상태
  const [inputName, setInputName] = useState("");
  const [inputTag, setInputTag] = useState("KR1");

  // 1. DB에서 데이터 로드
  const loadAllData = async () => {
    setLoading(true);
    try {
      const { data: dbFriends, error: dbError } = await supabase
        .from('friends')
        .select('*');

      if (dbError) throw dbError;

      const results = await Promise.all(
        (dbFriends || []).map(async (f) => {
          try {
            const res = await fetch(`https://api.henrikdev.xyz/valorant/v1/mmr/kr/${encodeURIComponent(f.name)}/${f.tag}`, {
              headers: { "Authorization": process.env.NEXT_PUBLIC_VALORANT_API_KEY || "" }
            });
            const json = await res.json();
            return json.status === 200 
              ? { ...json.data, id: `${f.name}#${f.tag}`, elo: json.data.elo || 0, error: false, name: f.name, tag: f.tag } 
              : { name: f.name, tag: f.tag, error: true, id: `${f.name}#${f.tag}`, elo: 0 };
          } catch (e) {
            return { name: f.name, tag: f.tag, error: true, id: `${f.name}#${f.tag}`, elo: 0 };
          }
        })
      );
      setPlayers(results);
    } catch (err) {
      console.error("데이터 로딩 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // 2. 친구 추가
  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName || !inputTag) return alert("이름과 태그를 입력하세요!");

    const { error } = await supabase
      .from('friends')
      .insert([{ name: inputName, tag: inputTag }]);

    if (error) {
      alert("추가 실패: " + error.message);
    } else {
      setInputName("");
      loadAllData();
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const generateMatch = () => {
    const selected = players.filter((p: any) => selectedIds.includes(p.id));
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
        {/* 상단 헤더 및 입력창 섹션 */}
        <header className="mb-12 flex flex-col gap-8 border-b border-gray-800 pb-10">
          <div>
            <h1 className="text-7xl font-black text-[#ff4655] italic uppercase tracking-tighter leading-none">SCRIM</h1>
            <p className="text-gray-500 mt-2 tracking-[0.3em] uppercase text-[10px]">Balanced Matchmaking System</p>
          </div>
          
          <div className="flex flex-col gap-4 w-full">
            {/* 닉네임 입력창: flex-1과 py-4로 크기를 키웠습니다 */}
            <form onSubmit={handleAddFriend} className="flex gap-2 w-full max-w-3xl">
              <input 
                type="text" 
                placeholder="닉네임" 
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="flex-1 bg-[#171f27] border border-gray-700 px-6 py-4 text-xl focus:outline-none focus:border-[#ff4655] transition-all"
              />
              <input 
                type="text" 
                placeholder="태그" 
                value={inputTag}
                onChange={(e) => setInputTag(e.target.value)}
                className="bg-[#171f27] border border-gray-700 px-4 py-4 text-xl w-32 focus:outline-none focus:border-[#ff4655] transition-all"
              />
              <button type="submit" className="bg-[#ff4655] hover:bg-white hover:text-[#ff4655] px-10 py-4 font-bold uppercase transition-colors text-lg">Add</button>
            </form>

            <button 
              onClick={generateMatch}
              className="w-full max-w-3xl bg-[#ff4655] hover:bg-white hover:text-[#ff4655] text-white font-black py-5 px-12 transition-all border-2 border-[#ff4655] shadow-[6px_6px_0px_0px_rgba(255,70,85,0.3)] text-xl"
            >
              GENERATE MATCH
            </button>
          </div>
        </header>

        {/* 매치 생성 결과창 */}
        {result && (
          <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-[#1f2933] border-l-4 border-[#ff4655] p-6 shadow-xl">
              <h3 className="text-[#ff4655] font-black italic uppercase tracking-tighter">Team A</h3>
              <div className="mt-4 space-y-2">
                {result.teamA.map(p => (
                  <div key={p.id} className="flex justify-between border-b border-gray-800 pb-1 italic">
                    <span>{p.name}</span>
                    <span className="text-gray-500 text-xs">{p.currenttierpatched}</span>
                  </div>
                ))}
                <p className="mt-4 text-[10px] text-gray-500 uppercase font-bold">Avg: {getAvgElo(result.teamA)} PTS</p>
              </div>
            </div>

            <div className="bg-[#ff4655] flex flex-col items-center justify-center p-6 text-center shadow-xl">
              <p className="text-[10px] font-black tracking-[0.3em] uppercase opacity-70">Battleground</p>
              <h2 className="text-4xl font-black italic uppercase tracking-tighter mt-2">{result.map}</h2>
            </div>

            <div className="bg-[#1f2933] border-r-4 border-blue-500 p-6 shadow-xl text-right">
              <h3 className="text-blue-500 font-black italic uppercase tracking-tighter">Team B</h3>
              <div className="mt-4 space-y-2">
                {result.teamB.map(p => (
                  <div key={p.id} className="flex justify-between flex-row-reverse border-b border-gray-800 pb-1 italic">
                    <span>{p.name}</span>
                    <span className="text-gray-500 text-xs">{p.currenttierpatched}</span>
                  </div>
                ))}
                <p className="mt-4 text-[10px] text-gray-500 uppercase font-bold">Avg: {getAvgElo(result.teamB)} PTS</p>
              </div>
            </div>
          </div>
        )}
        
        {/* 유저 리스트: 티어 구역을 작고 깔끔하게 슬림화 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {players.map((player: any) => (
            <div 
              key={player.id}
              onClick={() => toggleSelect(player.id)}
              className={`group cursor-pointer p-4 border-2 transition-all relative ${
                selectedIds.includes(player.id) ? "border-[#ff4655] bg-[#1f2933]" : "border-gray-900 bg-[#171f27] opacity-40 grayscale"
              }`}
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <p className="text-[9px] text-gray-600 font-mono italic">#{player.tag}</p>
                  {selectedIds.includes(player.id) && (
                    <span className="text-[8px] font-black bg-[#ff4655] px-1 italic">SELECTED</span>
                  )}
                </div>
                
                <h2 className="text-lg font-black truncate mt-1 uppercase">{player.name}</h2>
                
                <div className="mt-4 pt-3 border-t border-gray-800">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter">
                    <span className="text-gray-400">{player.currenttierpatched || "UNRANKED"}</span>
                    <span className="text-[#ff4655]">{player.elo || 0} PTS</span>
                  </div>
                  <div className="w-full bg-gray-900 h-1 mt-1">
                    <div 
                      className="bg-[#ff4655] h-full transition-all duration-700" 
                      style={{ width: `${player.error ? 0 : (player.ranking_in_tier || 0)}%` }}
                    ></div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    {player.images?.small && (
                      <img src={player.images.small} className="w-7 h-7 opacity-90" alt="" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}