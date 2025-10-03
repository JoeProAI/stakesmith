export type OddsEvent = {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: {
    key: string;
    title: string;
    last_update: string;
    markets: {
      key: string;
      last_update: string;
      outcomes: { name: string; price: number; point?: number }[];
    }[];
  }[];
};

export async function fetchDraftKingsOdds(): Promise<OddsEvent[]> {
  const api = process.env.ODDS_API_KEY;
  
  if (!api) {
    throw new Error('ODDS_API_KEY not configured. Add it to Vercel environment variables.');
  }
  
  try {
    // Fetch ALL upcoming NFL games with ALL markets including player props
    const url = 'https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds';
    const params = new URLSearchParams({
      apiKey: api,
      regions: 'us',
      markets: 'h2h,spreads,totals,player_pass_tds,player_pass_yds,player_rush_yds,player_receptions,alternate_spreads,alternate_totals',
      oddsFormat: 'american',
      bookmakers: 'draftkings'
    });
    
    const response = await fetch(`${url}?${params}`, { 
      next: { revalidate: 30 }, // Refresh every 30 seconds for live updates
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Odds API error (${response.status}): ${errorText}`);
    }
    
    const data = (await response.json()) as OddsEvent[];
    
    // Filter out games that already finished and sort by commence time
    const upcomingGames = data
      .filter(game => new Date(game.commence_time) > new Date())
      .sort((a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime());
    
    if (upcomingGames.length === 0) {
      throw new Error('No upcoming NFL games found. Check back later.');
    }
    
    console.log(`Fetched ${upcomingGames.length} games with player props`);
    return upcomingGames;
  } catch (error) {
    console.error('Odds API error:', error);
    throw error;
  }
}
