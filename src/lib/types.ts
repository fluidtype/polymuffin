export type GdeltDaily = { DayDate: number; avg_sentiment?: number; };
export type GdeltResp = { status?: string; action?: string; granularity?: string; data?: GdeltDaily[]; error?: string };
export type Tweet = { id:string; text:string };
export type Market = { id:string; question:string };
