import { useQuery } from "@tanstack/react-query";
import {
  Pack, PullRecord,
  buildPacksFromAssets, buildFeedFromAssets,
  PACKS as FALLBACK_PACKS, RECENT_PULLS as FALLBACK_PULLS,
} from "../data/packs";

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

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

async function fetchLive(): Promise<CourtyardData> {
  const res = await fetch("/api/pulls");
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  const assets: any[] = json.assets ?? [];
  if (!assets.length) throw new Error("Empty response");

  const packs = buildPacksFromAssets(assets);
  const recentPulls = buildFeedFromAssets(assets);
  if (!packs.length) throw new Error("No recognisable packs");

  const posEV = packs.filter(p => p.evRatio >= 1).length;
  const avgEV = packs.reduce((s, p) => s + p.evRatio, 0) / packs.length;
  const bestPack = packs.reduce((b, p) => p.evRatio > b.evRatio ? p : b, packs[0]);
  const lastUpdated = new Date().toISOString();

  return { packs, recentPulls, totalPulls: assets.length, posEV, avgEV, bestPack, lastUpdated, isLive: true, updatedAgo: "just now" };
}

function fallback(): CourtyardData {
  const packs = FALLBACK_PACKS;
  const posEV = packs.filter(p => p.evRatio >= 1).length;
  const avgEV = packs.reduce((s, p) => s + p.evRatio, 0) / packs.length;
  const bestPack = packs.reduce((b, p) => p.evRatio > b.evRatio ? p : b, packs[0]);
  return { packs, recentPulls: FALLBACK_PULLS, totalPulls: packs.reduce((s,p)=>s+p.totalPulls,0), posEV, avgEV, bestPack, lastUpdated: new Date().toISOString(), isLive: false, updatedAgo: "sample data" };
}

export function useCourtyardData() {
  return useQuery<CourtyardData>({
    queryKey: ["packpulse-live"],
    queryFn: async () => {
      try { return await fetchLive(); }
      catch (e) { console.warn("Live API failed, fallback:", e); return fallback(); }
    },
    staleTime: 55 * 1000,          // fresh for 55s
    refetchInterval: 60 * 1000,    // refetch every 60s
    refetchOnWindowFocus: true,
    retry: 1,
  });
}
