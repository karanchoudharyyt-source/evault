import { useQuery } from "@tanstack/react-query";
import {
  Pack,
  PullRecord,
  buildPacksFromAssets,
  buildFeedFromAssets,
  PACKS as FALLBACK_PACKS,
  RECENT_PULLS as FALLBACK_PULLS,
} from "../data/packs";

export interface CourtyardData {
  packs: Pack[];
  recentPulls: PullRecord[];
  totalPulls: number;
  posEV: number;
  avgEV: number;
  bestPack: Pack | null;
  lastUpdated: string;
  isLive: boolean; // true = real API data, false = fallback
}

async function fetchLiveData(): Promise<CourtyardData> {
  const res = await fetch("/api/pulls");

  if (!res.ok) {
    throw new Error(`API ${res.status}`);
  }

  const json = await res.json();
  const assets: any[] = json.assets ?? [];

  if (!assets.length) {
    throw new Error("No assets returned");
  }

  const packs = buildPacksFromAssets(assets);
  const recentPulls = buildFeedFromAssets(assets);

  // If we couldn't identify any packs, throw so fallback kicks in
  if (!packs.length) {
    throw new Error("No recognisable packs in data");
  }

  const totalPulls = assets.length;
  const posEV = packs.filter(p => p.evRatio >= 1).length;
  const avgEV = packs.reduce((sum, p) => sum + p.evRatio, 0) / packs.length;
  const bestPack = packs.reduce(
    (best, p) => (p.evRatio > best.evRatio ? p : best),
    packs[0]
  );

  return {
    packs,
    recentPulls,
    totalPulls,
    posEV,
    avgEV,
    bestPack,
    lastUpdated: new Date().toISOString(),
    isLive: true,
  };
}

function getFallbackData(): CourtyardData {
  const packs = FALLBACK_PACKS;
  const recentPulls = FALLBACK_PULLS;
  const posEV = packs.filter(p => p.evRatio >= 1).length;
  const avgEV = packs.reduce((sum, p) => sum + p.evRatio, 0) / packs.length;
  const bestPack = packs.reduce(
    (best, p) => (p.evRatio > best.evRatio ? p : best),
    packs[0]
  );
  return {
    packs,
    recentPulls,
    totalPulls: packs.reduce((s, p) => s + p.totalPulls, 0),
    posEV,
    avgEV,
    bestPack,
    lastUpdated: new Date().toISOString(),
    isLive: false,
  };
}

export function useCourtyardData() {
  return useQuery<CourtyardData>({
    queryKey: ["courtyard-live"],
    queryFn: async () => {
      try {
        return await fetchLiveData();
      } catch (err) {
        console.warn("Live API failed, using fallback:", err);
        return getFallbackData();
      }
    },
    staleTime: 4 * 60 * 1000,        // consider fresh for 4 min
    refetchInterval: 5 * 60 * 1000,  // auto-refresh every 5 min
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
