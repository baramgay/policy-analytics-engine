export type ThemeModeSetting = "light" | "dark" | "system";

export const THEME_MODE_STORAGE_KEY = "pae-theme-mode";

const MODE_ORDER: readonly ThemeModeSetting[] = ["light", "dark", "system"];

export function isThemeModeSetting(value: string | null): value is ThemeModeSetting {
  return value === "light" || value === "dark" || value === "system";
}

export function cycleThemeMode(current: ThemeModeSetting): ThemeModeSetting {
  const index = MODE_ORDER.indexOf(current);
  return MODE_ORDER[(index + 1) % MODE_ORDER.length];
}

export function readStoredThemeMode(storage: Pick<Storage, "getItem">): ThemeModeSetting {
  const stored = storage.getItem(THEME_MODE_STORAGE_KEY);
  return isThemeModeSetting(stored) ? stored : "system";
}
