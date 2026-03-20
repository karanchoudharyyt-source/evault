import { useQuery } from "@tanstack/react-query";
import { getPacks, getRecentPulls, Pack, PullRecord } from "../data/packs";

interface CourtyardData {
  packs: Pack[];
  recentPulls: PullRecord[];
  totalPulls: number;
  posEV: number;
  avgEV: number;
  bestPack: Pack | null;
  lastUpdated: string;
}

async function fetchCourtyardData(): Promise<CourtyardData> {
  const packs = getPacks();
  const recentPulls = getRecentPulls();

  const totalPulls = packs.reduce((sum, p) => sum + p.totalPulls, 0);
  const posEV = packs.filter((p) => p.evRatio >= 1).length;
  const avgEV =
    packs.reduce((sum, p) => sum + p.evRatio, 0) / packs.length;
  const bestPack =
    packs.length > 0
      ? packs.reduce((best, p) => (p.evRatio > best.evRatio ? p : best), packs[0])
      : null;
  const lastUpdated = new Date().toISOString();

  return { packs, recentPulls, totalPulls, posEV, avgEV, bestPack, lastUpdated };
}

export function useCourtyardData() {
  return useQuery<CourtyardData>({
    queryKey: ["packpulse-data"],
    queryFn: fetchCourtyardData,
    staleTime: 5 * 60 * 1000, // treat as fresh for 5 minutes
    refetchInterval: false,    // no automatic background refetching
    refetchOnWindowFocus: false,
  });
}
