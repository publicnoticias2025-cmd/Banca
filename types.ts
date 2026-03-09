
export interface Market {
  id: string;
  name: string;
  category: 'Gols' | 'Escanteios' | 'Cartões' | 'Handicap' | 'Resultado Final' | 'Resultado Correto' | 'Outros';
  type: 'Back' | 'Lay' | 'Ambos';
  isActive: boolean;
  createdAt: string;
  marketStakePercent?: number; // Specific stake % for this market (e.g., 0.5 for 0.5%)
}

export type StakeMode = 'manual' | 'percent' | 'kelly' | 'market';

export interface StakeConfig {
  mode: StakeMode;
  percent: number; // For 'percent' mode
  kellyFraction: number; // For 'kelly' mode (e.g., 0.25 for 1/4 Kelly)
}

export interface Bet {
  id: string;
  date: string;
  marketId: string; // Linked to Market.id
  marketName?: string; // Helper for display
  odd: number;
  stake: number;
  probability: number; // Estimated probability by the user (0-100)
  minute?: number; // Game minute at the time of the bet (0-90+)
  result: number;
  profit: number;
  ev: number; // Calculated EV percentage
  status: 'won' | 'lost' | 'pending';
  game: string;
}

export interface GrowthData {
  name: string;
  bank: number;
  projected?: number;
  growth?: number;
}

export interface WinRateData {
  name: string;
  value: number;
}

export interface BankrollConfig {
  initialBank: number;
  dailyInterest: number;
  periodDays: number;
}

export interface BankrollStats {
  current: number;
  initial: number;
  growthPct: number;
  drawdown: number;
  roi: number;
  totalProfit: number;
  todayProfit: number;
}

export interface ProjectionConfig {
  dailyTargetPct: number;
  horizonDays: number;
}

export interface MarketStats {
  marketId: string;
  marketName: string;
  roi: number;
  winRate: number;
  profit: number;
  evAverage: number;
  volume: number;
  drawdown: number;
  score: number;
  category: string;
}
