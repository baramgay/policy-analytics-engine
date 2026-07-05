import { describe, it, expect } from "vitest";
import { cycleThemeMode, readStoredThemeMode, isThemeModeSetting, THEME_MODE_STORAGE_KEY } from "./themeMode";

function makeFakeStorage(initial: Record<string, string> = {}): Pick<Storage, "getItem"> {
  const store = { ...initial };
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
  };
}

describe("cycleThemeMode", () => {
  it("cycles light -> dark", () => {
    expect(cycleThemeMode("light")).toBe("dark");
  });

  it("cycles dark -> system", () => {
    expect(cycleThemeMode("dark")).toBe("system");
  });

  it("cycles system -> light", () => {
    expect(cycleThemeMode("system")).toBe("light");
  });
});

describe("readStoredThemeMode", () => {
  it("defaults to system when nothing stored", () => {
    const storage = makeFakeStorage();
    expect(readStoredThemeMode(storage)).toBe("system");
  });

  it("returns the stored value when valid", () => {
    const storage = makeFakeStorage({ [THEME_MODE_STORAGE_KEY]: "dark" });
    expect(readStoredThemeMode(storage)).toBe("dark");
  });

  it("defaults to system when stored value is invalid", () => {
    const storage = makeFakeStorage({ [THEME_MODE_STORAGE_KEY]: "purple" });
    expect(readStoredThemeMode(storage)).toBe("system");
  });
});

describe("isThemeModeSetting", () => {
  it("accepts valid values", () => {
    expect(isThemeModeSetting("light")).toBe(true);
    expect(isThemeModeSetting("dark")).toBe(true);
    expect(isThemeModeSetting("system")).toBe(true);
  });

  it("rejects invalid values", () => {
    expect(isThemeModeSetting("purple")).toBe(false);
    expect(isThemeModeSetting(null)).toBe(false);
  });
});
