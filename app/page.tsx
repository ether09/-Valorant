"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase 클라이언트 설정 (Vercel 환경변수 사용)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MAPS = ["어비스", "로터스", "선셋", "헤이븐", "아이스박스", "바인드", "어센트"];

export default function Home() {
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [result, setResult] = useState<{ teamA: any[], teamB: any[], map: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // 닉네임 입력을 위한 상태
  const [inputName, setInputName] = useState("");
  const [inputTag, setInputTag] = useState("KR1");

  // 1. DB에서 친구 목록 가져와서 전적 API 연결하기
  const loadAllData = async () => {
    setLoading(true);
    try {
      // Supabase에서 리스트 가져오기
      const { data: dbFriends, error: dbError } = await supabase
        .from('friends')
        .select('*');

      if (dbError) throw dbError;

      // 가져온 리스트로 전적 API 호출
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

  // 2. 새로운 친구 추가하기 (DB 저장)
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
      loadAllData(); // 목록 새로고침
    }
  };

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
          
          <div className="flex flex-col gap-4 w-full md:w-auto">
            {/* 닉네임 추가 폼 */}
            <form onSubmit={handleAddFriend} className="flex gap-2">
              <input 
                type="text" 
                placeholder="닉네임" 
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="bg-[#171f27] border border-gray-700 px-4 py-2 text-sm focus:outline-none focus:border-[#ff4655]"
              />
              <input 
                type="text" 
                placeholder="태그" 
                value={inputTag}
                onChange={(e) => setInputTag(e.target.value)}
                className="bg-[#171f27] border border-gray-700 px-4 py-2 text-sm w-20 focus:outline-none focus:border-[#ff4655]"
              />
              <button type="submit" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 text-sm font-bold uppercase">Add</button>
            </form>

            <button 
              onClick={generateMatch}
              className="bg-[#ff4655] hover:bg-white hover:text-[#ff4655] text-white font-black py-5 px-12 transition-all border-2 border-[#ff4655] shadow-[6px_6px_0px_0px_rgba(255,70,85,0.3)]"
            >
              GENERATE MATCH
            </button>
          </div>
        </header>

        {/* 전력 분석 대시보드와 유저 그리드는 이전과 동일하므로 생략하거나 그대로 유지하세요 */}
        {/* ... (생략된 result 및 players.map 부분은 기존 코드와 동일합니다) */}
        
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