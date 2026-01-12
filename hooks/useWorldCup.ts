import { useState } from "react";

export function useWorldCup() {
  const [worldCupMode, setWorldCupMode] = useState(false);
  const [round, setRound] = useState<any[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  const [currentMatch, setCurrentMatch] = useState<[any, any] | null>(null);

  const startWorldCup = (availableStores: any[]) => {
    if (availableStores.length < 4)
      return alert("주변에 식당이 최소 4개 이상 있어야 합니다.");
    const shuffled = availableStores
      .sort(() => 0.5 - Math.random())
      .slice(0, 8);
    setRound(shuffled);
    setWinners([]);
    setCurrentMatch([shuffled[0], shuffled[1]]);
    setWorldCupMode(true);
  };

  const selectWinner = (winner: any) => {
    const nextWinners = [...winners, winner];
    if (round.length <= 2) {
      if (nextWinners.length === 1) return winner; // 최종 우승자 반환
      setRound(nextWinners);
      setWinners([]);
      setCurrentMatch([nextWinners[0], nextWinners[1]]);
    } else {
      const nextRound = round.slice(2);
      setRound(nextRound);
      setWinners(nextWinners);
      setCurrentMatch([nextRound[0], nextRound[1]]);
    }
    return null;
  };

  return {
    worldCupMode,
    setWorldCupMode,
    currentMatch,
    startWorldCup,
    selectWinner,
    roundInfo: `${winners.length + 1} / ${Math.ceil(
      (round.length + winners.length) / 2
    )} 대결`,
  };
}
