import type { OddsEvent } from './odds';

// Mock NFL odds data for fallback when API limit is hit
export const mockOddsData: OddsEvent[] = [
  {
    id: 'mock_1',
    home_team: 'Kansas City Chiefs',
    away_team: 'Buffalo Bills',
    bookmakers: [
      {
        key: 'draftkings',
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Kansas City Chiefs', price: -120 },
              { name: 'Buffalo Bills', price: +100 }
            ]
          },
          {
            key: 'spreads',
            outcomes: [
              { name: 'Kansas City Chiefs', price: -110, point: -2.5 },
              { name: 'Buffalo Bills', price: -110, point: 2.5 }
            ]
          },
          {
            key: 'totals',
            outcomes: [
              { name: 'Over', price: -110, point: 48.5 },
              { name: 'Under', price: -110, point: 48.5 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'mock_2',
    home_team: 'Philadelphia Eagles',
    away_team: 'Dallas Cowboys',
    bookmakers: [
      {
        key: 'draftkings',
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Philadelphia Eagles', price: -150 },
              { name: 'Dallas Cowboys', price: +130 }
            ]
          },
          {
            key: 'spreads',
            outcomes: [
              { name: 'Philadelphia Eagles', price: -110, point: -3.5 },
              { name: 'Dallas Cowboys', price: -110, point: 3.5 }
            ]
          },
          {
            key: 'totals',
            outcomes: [
              { name: 'Over', price: -110, point: 45.5 },
              { name: 'Under', price: -110, point: 45.5 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'mock_3',
    home_team: 'San Francisco 49ers',
    away_team: 'Los Angeles Rams',
    bookmakers: [
      {
        key: 'draftkings',
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'San Francisco 49ers', price: -180 },
              { name: 'Los Angeles Rams', price: +155 }
            ]
          },
          {
            key: 'spreads',
            outcomes: [
              { name: 'San Francisco 49ers', price: -110, point: -4.5 },
              { name: 'Los Angeles Rams', price: -110, point: 4.5 }
            ]
          },
          {
            key: 'totals',
            outcomes: [
              { name: 'Over', price: -110, point: 47.5 },
              { name: 'Under', price: -110, point: 47.5 }
            ]
          }
        ]
      }
    ]
  }
];
