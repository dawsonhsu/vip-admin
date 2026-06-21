export type AccountStatus = 'active' | 'disabled';
export type BetStatus = 'pending' | 'won' | 'lost' | 'void';
export type BetType = 'match' | 'outright' | 'inplay';

export type UserRow = {
  email: string;
  password_hash: string;
  name: string;
  status: AccountStatus;
  created_at: string;
};

export type MatchRow = {
  api_match_id: string;
  home_team: string;
  away_team: string;
  start_time: string;
  status: string;
  total_market_count: number;
  updated_at: string;
};

export type OddsRow = {
  api_match_id: string;
  market_key: string;
  market_category: string;
  market_type: string;
  market_label_zh: string;
  period: number;
  selection_label_zh: string;
  selection_key: string;
  line: string;
  price_decimal: number;
  price_american: number;
  status: string;
  updated_at: string;
};

export type OutrightRow = {
  outright_id: string;
  category_zh: string;
  description_zh: string;
  selection_label: string;
  selection_id: string;
  price_decimal: number;
  price_american: number;
  status: string;
  updated_at: string;
};

export type InPlaySelection = {
  selection_id: string;
  selection_label_zh: string;
  selection_key: string;
  line: string;
  price_decimal: number;
};

export type InPlayMarket = {
  market_id: string;
  market_label_zh: string;
  market_category: string;
  period: number;
  in_running: boolean;
  selections: InPlaySelection[];
};

export type InPlayMatch = {
  no: string;
  api_match_id: string;
  home_team: string;
  away_team: string;
  start_time: string;
  tournament: string;
  country: string;
  sr_id: string;
  live: {
    status: string | null;
    serve: string | null;
    scores: Record<string, { home: number; away: number }> | null;
  } | null;
  total_market_count: number;
  markets: InPlayMarket[];
};

export type InPlayResponse = {
  updated_at: string;
  matches: InPlayMatch[];
};

export type BetRow = {
  bet_id: string;
  created_at: string;
  email: string;
  name: string;
  bet_type: BetType;
  match_name: string;
  match_time: string;
  api_match_id: string;
  outright_id: string;
  market_category: string;
  market_label_zh: string;
  selection_label_zh: string;
  line: string;
  price_decimal: number;
  stake: number;
  status: BetStatus;
};

export type WinSession = {
  email: string;
  name: string;
};

export type BetSelection = {
  bet_type: BetType;
  event_label: string;
  event_time?: string;
  api_match_id?: string;
  no?: string;
  market_key?: string;
  market_id?: string;
  outright_id?: string;
  selection_id?: string;
  market_category: string;
  market_label_zh: string;
  selection_label_zh: string;
  line: string;
  price_decimal: number;
};

export type BetPostBody = {
  bet_type: BetType;
  stake: number;
  api_match_id?: string;
  no?: string;
  market_key?: string;
  market_id?: string;
  outright_id?: string;
  selection_id?: string;
};
