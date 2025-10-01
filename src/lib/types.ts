export type GdeltDaily = {
  DayDate: number;          // YYYYMMDD
  avg_sentiment?: number;   // tone
  avg_impact?: number;      // Goldstein
  conflict_events?: number; // conflict count
  interaction_count?: number;
  total_daily_articles?: number;
  relative_coverage?: number;
};

export type GdeltResp = {
  status?: 'success'|'error';
  action?: string;
  granularity?: 'daily'|'monthly';
  data?: GdeltDaily[];
  error?: string;
  insights?: unknown;
};

export type Tweet = {
  id: string;
  text: string;
  author?: string;
  like_count?: number;
  retweet_count?: number;
  created_at?: string;
};

export type Market = {
  id: string;
  question: string;
  endDate?: string;
  volume?: number;
};
