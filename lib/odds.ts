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
  gameStatus?: 'upcoming' | 'live' | 'recently_finished';
  minutesUntilStart?: number;
};

export function getGameStatus(commenceTime: string): { 
  status: 'upcoming' | 'live' | 'recently_finished';
  minutesUntilStart: number;
  timeDisplay: string;
} {
  const now = new Date();
  const gameTime = new Date(commenceTime);
  const minutesUntilStart = Math.floor((gameTime.getTime() - now.getTime()) / (1000 * 60));
  
  let status: 'upcoming' | 'live' | 'recently_finished';
  let timeDisplay: string;
  
  if (minutesUntilStart > 0) {
    status = 'upcoming';
    if (minutesUntilStart < 60) {
      timeDisplay = `${minutesUntilStart}m`;
    } else if (minutesUntilStart < 1440) { // Less than 24 hours
      const hours = Math.floor(minutesUntilStart / 60);
      timeDisplay = `${hours}h ${minutesUntilStart % 60}m`;
    } else {
      const days = Math.floor(minutesUntilStart / 1440);
      timeDisplay = `${days}d`;
    }
  } else if (minutesUntilStart > -240) { // Started within last 4 hours
    status = 'live';
    const minutesElapsed = Math.abs(minutesUntilStart);
    timeDisplay = `Live ${minutesElapsed}m`;
  } else {
    status = 'recently_finished';
    timeDisplay = 'Finished';
  }
  
  return { status, minutesUntilStart, timeDisplay };
}

// Featured markets (most common, available for all games)
export async function fetchDraftKingsOdds(): Promise<OddsEvent[]> {
  const api = process.env.ODDS_API_KEY;
  
  if (!api) {
    throw new Error('ODDS_API_KEY not configured. Add it to Vercel environment variables.');
  }
  
  try {
    // Fetch upcoming NFL games with FEATURED markets (h2h, spreads, totals)
    // These are the most common markets available for all games
    const url = 'https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds';
    const params = new URLSearchParams({
      apiKey: api,
      regions: 'us',
      markets: 'h2h,spreads,totals', // Featured markets only
      oddsFormat: 'american',
      bookmakers: 'draftkings'
    });
    
    const response = await fetch(`${url}?${params}`, { 
      next: { revalidate: 60 }, // Refresh every 60 seconds
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Odds API error (${response.status}): ${errorText}`);
    }
    
    const data = (await response.json()) as OddsEvent[];
    
    // Add status information to each game and filter out finished games
    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - (4 * 60 * 60 * 1000));
    
    const availableGames = data
      .filter(game => {
        const commenceTime = new Date(game.commence_time);
        // Include if game starts in the future OR started within last 4 hours
        return commenceTime > fourHoursAgo;
      })
      .map(game => {
        const statusInfo = getGameStatus(game.commence_time);
        return {
          ...game,
          gameStatus: statusInfo.status,
          minutesUntilStart: statusInfo.minutesUntilStart
        };
      })
      .sort((a, b) => {
        // Sort by: upcoming first, then by start time
        if (a.gameStatus === 'upcoming' && b.gameStatus !== 'upcoming') return -1;
        if (a.gameStatus !== 'upcoming' && b.gameStatus === 'upcoming') return 1;
        return new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime();
      });
    
    if (availableGames.length === 0) {
      throw new Error('No live or upcoming NFL games found. Check back on game day.');
    }
    
    // Log stats for monitoring
    const upcoming = availableGames.filter(g => g.gameStatus === 'upcoming').length;
    const live = availableGames.filter(g => g.gameStatus === 'live').length;
    console.log(`📊 Odds API: ${upcoming} upcoming, ${live} live games`);
    
    return availableGames;
  } catch (error) {
    throw error;
  }
}

// Fetch detailed odds for a specific event (includes player props and additional markets)
export async function fetchEventOdds(eventId: string): Promise<OddsEvent | null> {
  const api = process.env.ODDS_API_KEY;
  
  if (!api) {
    throw new Error('ODDS_API_KEY not configured.');
  }
  
  try {
    // Use the /events/{eventId}/odds endpoint for detailed markets
    const url = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/events/${eventId}/odds`;
    const params = new URLSearchParams({
      apiKey: api,
      regions: 'us',
      markets: [
        // Game markets
        'h2h', 'spreads', 'totals',
        // Alternate markets
        'alternate_spreads', 'alternate_totals',
        // Player props - Passing
        'player_pass_tds', 'player_pass_yds', 'player_pass_completions', 'player_pass_attempts', 'player_pass_interceptions', 'player_pass_longest_completion',
        // Player props - Rushing
        'player_rush_yds', 'player_rush_attempts', 'player_rush_longest',
        // Player props - Receiving
        'player_receptions', 'player_reception_yds', 'player_reception_longest',
        // Player props - Anytime TD
        'player_anytime_td',
        // Player props - First TD
        'player_first_td',
        // Player props - Kicking
        'player_field_goals',
        // Game period markets
        'h2h_q1', 'h2h_q2', 'h2h_q3', 'h2h_q4', 'h2h_h1', 'h2h_h2',
        'spreads_q1', 'spreads_q2', 'spreads_q3', 'spreads_q4', 'spreads_h1', 'spreads_h2',
        'totals_q1', 'totals_q2', 'totals_q3', 'totals_q4', 'totals_h1', 'totals_h2'
      ].join(','),
      oddsFormat: 'american',
      bookmakers: 'draftkings'
    });
    
    const response = await fetch(`${url}?${params}`, { 
      next: { revalidate: 60 },
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json() as OddsEvent;
    return data;
  } catch (error) {
    return null;
  }
}
