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
  historyTokenBudget: number;
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
  turnTimeoutMs: 120_000,
  historyTokenBudget: 32_000,
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
