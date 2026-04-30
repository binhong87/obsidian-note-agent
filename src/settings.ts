import type { Mode, ProviderId, Locale } from "./types";
import { PROVIDER_DEFAULTS, defaultProfile } from "./providers/defaults";

export interface ScheduledTaskSetting {
  enabled: boolean;
  time: string;
  targetFolder: string;
  weekday?: number;
}

export interface ProviderProfile {
  apiKey: string;
  /** Empty string means "use the provider's default base URL". */
  baseUrl: string;
  model: string;
  /** For the "custom" provider: which wire protocol to use. Ignored for others. */
  compat?: "openai" | "anthropic";
}

export interface Settings {
  providerId: ProviderId;
  /** Per-provider credentials + model so switching providers doesn't clobber fields. */
  providers: Record<ProviderId, ProviderProfile>;
  mode: Mode;
  chatsFolder: string;
  locale: Locale;
  /** Free-form user description injected into every system prompt. */
  userProfile: string;
  /** Delete conversations older than this many days. 0 = never purge. */
  historyRetentionDays: number;
  /** In Edit mode, commit writes immediately and back up originals instead of queueing for approval. */
  autoApprove: boolean;
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

function defaultProviders(): Record<ProviderId, ProviderProfile> {
  const out = {} as Record<ProviderId, ProviderProfile>;
  for (const id of Object.keys(PROVIDER_DEFAULTS) as ProviderId[]) out[id] = defaultProfile(id);
  return out;
}

export const DEFAULT_SETTINGS: Settings = {
  providerId: "openai",
  providers: defaultProviders(),
  mode: "ask",
  chatsFolder: "smart-note-agent/chats",
  locale: "auto",
  userProfile: "",
  historyRetentionDays: 30,
  autoApprove: false,
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

/** Shape of the pre-refactor settings — used only inside migrateSettings. */
interface LegacySettings {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export function migrateSettings(raw: (Partial<Settings> & LegacySettings) | undefined): Settings {
  const r = raw ?? {};
  const providerId: ProviderId = (r.providerId ?? DEFAULT_SETTINGS.providerId);

  // Start with full default profiles so every provider has a usable entry
  const providers: Record<ProviderId, ProviderProfile> = { ...defaultProviders(), ...(r.providers ?? {}) };

  // Fold legacy flat fields into the active provider's profile
  const hasLegacy = r.apiKey !== undefined || r.baseUrl !== undefined || r.model !== undefined;
  if (hasLegacy) {
    const existing = providers[providerId] ?? defaultProfile(providerId);
    providers[providerId] = {
      apiKey:  r.apiKey  ?? existing.apiKey,
      baseUrl: r.baseUrl ?? existing.baseUrl,
      model:   r.model   ?? existing.model,
    };
  }

  const { apiKey: _a, baseUrl: _b, model: _m, providers: _p, scheduled: _s, ...rest } = r;

  // Migrate old default chats folder paths to the new vault-root location
  if (rest.chatsFolder === "_agent/chats" || /^\.obsidian\//.test(rest.chatsFolder ?? "")) delete rest.chatsFolder;

  return {
    ...DEFAULT_SETTINGS,
    ...rest,
    providerId,
    providers,
    scheduled: {
      dailySummary: { ...DEFAULT_SETTINGS.scheduled.dailySummary, ...(r.scheduled?.dailySummary ?? {}) },
      weeklyReview: { ...DEFAULT_SETTINGS.scheduled.weeklyReview, ...(r.scheduled?.weeklyReview ?? {}) },
    },
  };
}

/** Resolve the active profile with defaults applied (empty baseUrl → provider default). */
export function activeProfile(s: Settings): { apiKey: string; baseUrl: string; model: string; compat?: "openai" | "anthropic" } {
  const p = s.providers[s.providerId] ?? defaultProfile(s.providerId);
  const d = PROVIDER_DEFAULTS[s.providerId];
  return {
    apiKey: p.apiKey,
    baseUrl: p.baseUrl || d.baseUrl,
    model: p.model || d.model,
    compat: p.compat,
  };
}
