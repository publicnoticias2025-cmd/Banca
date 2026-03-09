
import { Bet, BankrollStats, GrowthData, ProjectionConfig, MarketStats, Market, BankrollConfig, StakeConfig } from '../types';

const getHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const calculateProfit = (stake: number, odd: number, status: Bet['status']): number => {
  if (status === 'won') return (stake * odd) - stake;
  if (status === 'lost') return -stake;
  return 0;
};

const calculateResult = (stake: number, odd: number, status: Bet['status']): number => {
  if (status === 'won') return stake * odd;
  if (status === 'lost') return 0;
  return 0;
};

const calculateEV = (odd: number, probability: number): number => {
  if (!odd || odd === 0) return 0;
  return ((probability / 100) * odd - 1) * 100;
};

// Mock data for markets since we haven't implemented backend for it yet
let markets: Market[] = [
  { id: 'm1', name: 'Over 2.5', category: 'Gols', type: 'Back', isActive: true, createdAt: '2025-01-01', marketStakePercent: 2 },
  { id: 'm2', name: 'BTTS', category: 'Gols', type: 'Ambos', isActive: true, createdAt: '2025-01-02', marketStakePercent: 1.5 },
  { id: 'm3', name: 'Handicap -1.5', category: 'Handicap', type: 'Back', isActive: true, createdAt: '2025-01-03', marketStakePercent: 1 },
  { id: 'm4', name: 'Under 3.5', category: 'Gols', type: 'Back', isActive: true, createdAt: '2025-01-04', marketStakePercent: 1.5 },
  { id: 'm5', name: 'ML Favorito', category: 'Resultado Final', type: 'Back', isActive: true, createdAt: '2025-01-05', marketStakePercent: 3 },
  { id: 'm6', name: 'Resultado Correto', category: 'Resultado Correto', type: 'Back', isActive: true, createdAt: '2025-05-10', marketStakePercent: 0.5 },
];

export const api = {
  getBankConfig: async (): Promise<BankrollConfig> => {
    const res = await fetch('/api/bankroll', { headers: getHeaders() });
    const data = await res.json();
    return {
      initialBank: data.initial_bank,
      dailyInterest: data.daily_interest || 2,
      periodDays: data.period_days || 30
    };
  },
  
  updateBankConfig: async (config: BankrollConfig) => {
    const res = await fetch('/api/bankroll', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        initial_bank: config.initialBank,
        current_bank: config.initialBank, // Simplified
        daily_interest: config.dailyInterest,
        period_days: config.periodDays,
        currency: 'BRL'
      })
    });
    return res.json();
  },

  getStakeConfig: async (): Promise<StakeConfig> => {
    const res = await fetch('/api/stake-config', { headers: getHeaders() });
    const data = await res.json();
    return {
      mode: data.mode || 'percent',
      percent: data.percent || 2,
      kellyFraction: data.kelly_fraction || 0.25
    };
  },
  
  updateStakeConfig: async (config: StakeConfig) => {
    const res = await fetch('/api/stake-config', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        mode: config.mode,
        percent: config.percent,
        kelly_fraction: config.kellyFraction
      })
    });
    const data = await res.json();
    return {
      mode: data.mode,
      percent: data.percent,
      kellyFraction: data.kelly_fraction
    } as StakeConfig;
  },

  getMarkets: async () => [...markets],
  addMarket: async (market: Omit<Market, 'id' | 'createdAt'>) => {
    const newMarket: Market = { ...market, id: `m${Date.now()}`, createdAt: new Date().toISOString() };
    markets.push(newMarket);
    return newMarket;
  },
  toggleMarketStatus: async (id: string) => {
    markets = markets.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m);
  },

  getBets: async () => {
    const res = await fetch('/api/bets', { headers: getHeaders() });
    const bets: any[] = await res.json();
    return bets.map(b => ({
      ...b,
      game: b.event, // Map backend 'event' to frontend 'game'
      marketId: b.market, // Map backend 'market' to frontend 'marketId'
      odd: b.odds, // Map backend 'odds' to frontend 'odd'
      marketName: markets.find(m => m.id === b.market)?.name || 'Desconhecido'
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  
  addBet: async (bet: Omit<Bet, 'id' | 'profit' | 'result' | 'ev'>) => {
    const profit = calculateProfit(bet.stake, bet.odd, bet.status);
    const res = await fetch('/api/bets', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        event: bet.game,
        market: bet.marketId,
        stake: bet.stake,
        odds: bet.odd,
        status: bet.status,
        profit: profit,
        date: bet.date,
        minute: bet.minute,
        probability: bet.probability
      })
    });
    return res.json();
  },

  updateBet: async (id: string, betData: Partial<Bet>) => {
    const profit = calculateProfit(betData.stake || 0, betData.odd || 0, betData.status || 'pending');
    const res = await fetch(`/api/bets/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        event: betData.game,
        market: betData.marketId,
        stake: betData.stake,
        odds: betData.odd,
        status: betData.status,
        profit: profit,
        date: betData.date,
        minute: betData.minute,
        probability: betData.probability
      })
    });
    return res.json();
  },

  updateBetStatus: async (id: string, status: Bet['status']) => {
    // We need to get the bet first to calculate profit correctly
    const bets = await api.getBets();
    const bet = bets.find(b => b.id === id);
    if (!bet) return;

    const profit = calculateProfit(bet.stake, bet.odd, status);
    const res = await fetch(`/api/bets/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, profit })
    });
    return res.json();
  },

  deleteBet: async (id: string) => {
    const res = await fetch(`/api/bets/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  getBankrollStats: async (): Promise<BankrollStats> => {
    const betsRes = await fetch('/api/bets', { headers: getHeaders() });
    const bets: any[] = await betsRes.json();
    const bankRes = await fetch('/api/bankroll', { headers: getHeaders() });
    const bankConfig = await bankRes.json();

    const totalProfit = bets.reduce((acc, b) => acc + b.profit, 0);
    const initial = bankConfig.initial_bank || 10000;
    const current = initial + totalProfit;
    const totalStaked = bets.reduce((acc, b) => acc + b.stake, 0);
    const today = new Date().toISOString().split('T')[0];
    const todayProfit = bets.filter(b => b.date === today).reduce((acc, b) => acc + (b.profit || 0), 0);

    return {
      current,
      initial,
      growthPct: (totalProfit / initial) * 100,
      drawdown: -4.2,
      roi: totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0,
      totalProfit,
      todayProfit
    };
  },

  getGrowthProjection: async (config: ProjectionConfig): Promise<GrowthData[]> => {
    const bankRes = await fetch('/api/bankroll', { headers: getHeaders() });
    const bankConfig = await bankRes.json();
    const initial = bankConfig.initial_bank || 10000;

    const data: GrowthData[] = [];
    const dailyRate = 1 + (config.dailyTargetPct / 100);
    for (let i = 0; i <= config.horizonDays; i += Math.max(1, Math.floor(config.horizonDays / 10))) {
      const projected = initial * Math.pow(dailyRate, i);
      data.push({ name: `Dia ${i}`, bank: i === 0 ? initial : 0, projected: projected });
    }
    return data;
  },

  getMarketStats: async (): Promise<MarketStats[]> => {
    const betsRes = await fetch('/api/bets', { headers: getHeaders() });
    const bets: any[] = await betsRes.json();
    
    const marketMap = new Map<string, any[]>();
    bets.forEach(bet => {
      const list = marketMap.get(bet.market) || [];
      list.push(bet);
      marketMap.set(bet.market, list);
    });

    const results: MarketStats[] = Array.from(marketMap.entries()).map(([marketId, marketBets]) => {
      const marketObj = markets.find(m => m.id === marketId);
      const totalStake = marketBets.reduce((acc, b) => acc + b.stake, 0);
      const totalProfit = marketBets.reduce((acc, b) => acc + (b.profit || 0), 0);
      const wins = marketBets.filter(b => b.status === 'won').length;
      const roi = (totalProfit / totalStake) * 100;
      const winRate = (wins / marketBets.length) * 100;
      const score = (roi * 0.4) + (winRate * 0.3) - (5.0 * 0.3);

      return {
        marketId,
        marketName: marketObj?.name || 'Inativo',
        roi,
        winRate,
        profit: totalProfit,
        evAverage: 0, // Simplified
        volume: marketBets.length,
        drawdown: -5.0,
        score: Math.max(0, Math.min(100, score * 2)),
        category: marketObj?.category || 'N/A'
      };
    });
    return results.sort((a, b) => b.score - a.score);
  },

  calculateRecommendedStake: (bankroll: number, config: StakeConfig, bet: { odd: number, probability: number, marketId?: string }): number => {
    if (config.mode === 'manual') return 0;
    
    if (config.mode === 'percent') {
      return bankroll * (config.percent / 100);
    }

    if (config.mode === 'kelly') {
      if (bet.odd <= 1) return 0;
      const p = bet.probability / 100;
      const b = bet.odd - 1;
      const kelly = (p * b - (1 - p)) / b;
      const suggested = bankroll * Math.max(0, kelly) * config.kellyFraction;
      return Math.round(suggested);
    }

    if (config.mode === 'market') {
      const market = markets.find(m => m.id === bet.marketId);
      const pct = market?.marketStakePercent || 1; // Fallback to 1%
      return bankroll * (pct / 100);
    }
    return 0;
  },

  // Admin Methods
  getAdminUsers: async () => {
    const res = await fetch('/api/admin/users', { headers: getHeaders() });
    return res.json();
  },

  createAdminUser: async (userData: any) => {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    return res.json();
  },

  deleteAdminUser: async (id: string) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  resetData: async (password: string) => {
    const res = await fetch('/api/user/reset-data', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ password })
    });
    return res.json();
  }
};

