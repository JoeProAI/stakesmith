export type OddsEvent = {
  id: string;
  home_team: string;
  away_team: string;
  bookmakers: {
    key: string;
    markets: {
      key: string;
      outcomes: { name: string; price: number; point?: number }[];
    }[];
  }[];
};

export async function fetchDraftKingsOdds(): Promise<OddsEvent[]> {
  const api = process.env.ODDS_API_KEY!;
  const url =
    'https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds?regions=us&oddsFormat=american&bookmakers=draftkings&markets=h2h,spreads,totals';
  const r = await fetch(`${url}&apiKey=${api}`, { next: { revalidate: 60 } });
  if (!r.ok) throw new Error('Odds API error');
  return (await r.json()) as OddsEvent[];
}
