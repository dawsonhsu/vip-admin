import type { InPlayMatch, InPlayResponse } from './types';
import { getInPlay } from './sheets';

// In-play data is fetched + decoded by the local Windows scheduler
// (winwinwin-scheduler/inplay_scheduler.py) and written to the Google Sheets
// `inplay` tab — the webapp only reads it (see sheets.getInPlay). This avoids
// fetching Taiwan Sports Lottery server-side from Vercel, whose datacenter
// CloudFront edge serves a stale (or 403) copy regardless of region/cache-busting.
export async function getInPlayData(_sport = '足球'): Promise<InPlayResponse> {
  return getInPlay();
}

export async function getInPlayMatch(no: string, sport = '足球'): Promise<InPlayMatch | null> {
  const data = await getInPlayData(sport);
  return data.matches.find((match) => match.no === no) ?? null;
}
