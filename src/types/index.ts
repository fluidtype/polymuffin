export interface GdeltSeriesPoint {
  date: string;
  conflict_events?: number;
  avg_sentiment?: number;
  avg_impact?: number;
  interaction_count?: number;
  relative_coverage?: number;
}

export interface GdeltEvent {
  SQLDATE: number | string;
  SOURCEURL: string;
  Actor1CountryCode?: string;
  EventCode?: string;
  AvgTone?: number;
  /* add other GDELT fields */
  [key: string]: unknown;
}

export interface GdeltInsights {
  total_events?: number;
  keyword_matches?: Record<string, number>;
  sentiment_analysis?: {
    avg_tone?: number;
  };
  temporal_distribution?: { date: string; count: number }[];
  top_actors?: ({ name: string; mentions?: number } | string)[];
  spikes?: { label: string; severity?: 'low' | 'medium' | 'high' }[];
  last_updated?: string;
  fallback_notes?: string[];
  /* add from context insights */
  [key: string]: unknown;
}

export interface PolyToken {
  id: string;
  outcome: 'YES' | 'NO';
  price?: number;
}

export interface PolyMarket {
  id: string;
  title: string;
  endDate: string | null;
  volume24h: number;
  liquidity: number;
  status: string;
  category?: string;
  tokens: PolyToken[];
  priceYes?: number;
  priceNo?: number;
}

export interface PolyTrade {
  price: number;
  size: number;
  timestamp: string;
}
