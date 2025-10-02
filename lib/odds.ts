import { mockOddsData } from './mock-odds';

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
  const api = process.env.ODDS_API_KEY || '';
  
  // If no API key or mock mode enabled, use mock data
  if (!api || process.env.USE_MOCK_ODDS === 'true') {
    console.log('Using mock odds data (no API calls)');
    return mockOddsData;
  }
  
  try {
    const url =
      'https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds?regions=us&oddsFormat=american&bookmakers=draftkings&markets=h2h,spreads,totals';
    const r = await fetch(`${url}&apiKey=${api}`, { next: { revalidate: 60 } });
    
    if (!r.ok) {
      // Fallback to mock data on API error
      console.warn('Odds API error, falling back to mock data');
      return mockOddsData;
    }
    
    return (await r.json()) as OddsEvent[];
  } catch (error) {
    // Fallback to mock data on any error (quota exceeded, network issues, etc.)
    console.warn('Odds API failed, using mock data:', error);
    return mockOddsData;
  }
}
