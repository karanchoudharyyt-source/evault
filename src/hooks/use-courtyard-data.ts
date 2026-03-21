import { useQuery } from "@tanstack/react-query";
import { Pack, PullRecord } from "../data/packs";

export interface CourtyardData {
  packs: Pack[];
  recentPulls: PullRecord[];
  totalPulls: number;
  posEV: number;
  avgEV: number;
  bestPack: Pack | null;
  lastUpdated: string;
  isLive: boolean;
  updatedAgo: string;
}

async function fetchLive(): Promise<CourtyardData> {
  const res = await fetch("/api/pulls");
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();

  // New API returns { packs, recentPulls, totalPacks }
  if (json.packs && Array.isArray(json.packs)) {
    const packs: Pack[] = json.packs;
    const recentPulls: PullRecord[] = (json.recentPulls ?? []).map((r: any) => ({
      id:       r.id,
      buyer:    r.buyer ?? 'anon',
      packName: packs.find(p => p.id === r.packSlug)?.name ?? r.packSlug ?? '?',
      packId:   r.packSlug ?? '',
      fmv:      r.fmv ?? 0,
      delta:    (r.fmv ?? 0) - (packs.find(p => p.id === r.packSlug)?.price ?? 50),
      image:    r.image ?? '',
      title:    r.title ?? '',
      grade:    r.grade ?? '',
      txTime:   r.txTime ?? new Date().toISOString(),
    }));

    if (!packs.length) throw new Error("No packs with data");
    const posEV    = packs.filter(p => p.evRatio >= 1).length;
    const avgEV    = packs.reduce((s, p) => s + p.evRatio, 0) / packs.length;
    const bestPack = packs.reduce((b, p) => p.evRatio > b.evRatio ? p : b, packs[0]);

    return {
      packs, recentPulls,
      totalPulls: recentPulls.length,
      posEV, avgEV, bestPack,
      lastUpdated: new Date().toISOString(),
      isLive: true,
      updatedAgo: "just now",
    };
  }

  throw new Error("Unexpected API response shape");
}

export function useCourtyardData() {
  return useQuery<CourtyardData>({
    queryKey: ["packpulse-live"],
    queryFn: async () => {
      try { return await fetchLive(); }
      catch (e) {
        console.warn("Live API failed:", e);
        // Return empty state — no hardcoded fallback data
        return {
          packs: [], recentPulls: [], totalPulls: 0,
          posEV: 0, avgEV: 0, bestPack: null,
          lastUpdated: new Date().toISOString(),
          isLive: false, updatedAgo: "loading...",
        };
      }
    },
    staleTime: 28 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}
