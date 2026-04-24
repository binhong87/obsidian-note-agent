import type { Mode, ProviderId, Locale } from "./types";

export interface ScheduledTaskSetting {
  enabled: boolean;
  time: string;
  targetFolder: string;
  weekday?: number;
}

export interface Settings {
  providerId: ProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
  mode: Mode;
  chatsFolder: string;
  locale: Locale;
  maxIterations: number;
  turnTimeoutMs: number;
  /** Legacy history cap in approx-tokens. 0 = derive from model's context window. */
  historyTokenBudget: number;
  /** Tokens to reserve for the model's response when computing effective context budget. */
  responseReserveTokens: number;
  /** Fraction of effective budget at which auto-compaction triggers (0–1). */
  autoCompactThreshold: number;
  /** Number of most-recent turn-groups to keep verbatim during compaction. */
  keepLastTurns: number;
  scheduled: {
    dailySummary: ScheduledTaskSetting;
    weeklyReview: ScheduledTaskSetting;
  };
}

export const DEFAULT_SETTINGS: Settings = {
  providerId: "openai",
  apiKey: "",
  baseUrl: "",
  model: "",
  mode: "ask",
  chatsFolder: "_agent/chats",
  locale: "auto",
  maxIterations: 25,
  turnTimeoutMs: 300_000,
  historyTokenBudget: 0,       // 0 = auto (derive from model caps)
  responseReserveTokens: 4096,
  autoCompactThreshold: 0.75,
  keepLastTurns: 6,
  scheduled: {
    dailySummary: { enabled: false, time: "22:00", targetFolder: "_agent/summaries/daily" },
    weeklyReview: { enabled: false, time: "22:00", targetFolder: "_agent/summaries/weekly", weekday: 0 },
  },
};

export function migrateSettings(raw: Partial<Settings> | undefined): Settings {
  return {
    ...DEFAULT_SETTINGS,
    ...(raw ?? {}),
    scheduled: {
      dailySummary: { ...DEFAULT_SETTINGS.scheduled.dailySummary, ...(raw?.scheduled?.dailySummary ?? {}) },
      weeklyReview: { ...DEFAULT_SETTINGS.scheduled.weeklyReview, ...(raw?.scheduled?.weeklyReview ?? {}) },
    },
  };
}
