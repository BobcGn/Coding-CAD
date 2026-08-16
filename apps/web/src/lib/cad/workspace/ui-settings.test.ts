import assert from "node:assert/strict";
import { afterEach, describe, it, vi } from "vitest";
import {
  DEFAULT_UI_SETTINGS,
  applyTheme,
  loadUiSettings,
  resolveTheme,
  saveUiSettings,
  systemPrefersDark,
  uiText
} from "./ui-settings.js";

const STORAGE_KEY = "coding-cad-ui-settings";

function stubStorage(initial: Record<string, string> = {}): void {
  const store = new Map(Object.entries(initial));
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); }
  });
  vi.stubGlobal("document", { documentElement: { setAttribute: vi.fn(), getAttribute: () => null } });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ui settings (P3 closeout)", () => {
  it("defaults to system theme and English locale", () => {
    stubStorage();
    assert.deepEqual(loadUiSettings(), DEFAULT_UI_SETTINGS);
    assert.equal(DEFAULT_UI_SETTINGS.theme, "system");
    assert.equal(DEFAULT_UI_SETTINGS.locale, "en");
  });

  it("loads persisted settings and falls back on invalid values", () => {
    stubStorage({ [STORAGE_KEY]: JSON.stringify({ theme: "dark", locale: "en" }) });
    assert.deepEqual(loadUiSettings(), { theme: "dark", locale: "en" });

    stubStorage({ [STORAGE_KEY]: JSON.stringify({ theme: "bogus", locale: "en" }) });
    assert.deepEqual(loadUiSettings(), DEFAULT_UI_SETTINGS);

    stubStorage({ [STORAGE_KEY]: "{invalid json" });
    assert.deepEqual(loadUiSettings(), DEFAULT_UI_SETTINGS);
  });

  it("persists settings to localStorage", () => {
    stubStorage();
    saveUiSettings({ theme: "light", locale: "en" });
    const stored = (globalThis.localStorage as unknown as { getItem(key: string): string | null })
      .getItem(STORAGE_KEY);
    assert.equal(stored, JSON.stringify({ theme: "light", locale: "en" }));
  });

  it("resolves system theme against the preferred color scheme", () => {
    assert.equal(resolveTheme("system", true), "dark");
    assert.equal(resolveTheme("system", false), "light");
    assert.equal(resolveTheme("dark", false), "dark");
    assert.equal(resolveTheme("light", true), "light");
  });

  it("applies the resolved theme to the document root", () => {
    stubStorage();
    applyTheme("dark", false);
    const setAttribute = (globalThis.document.documentElement as unknown as { setAttribute: ReturnType<typeof vi.fn> })
      .setAttribute;
    assert.equal(setAttribute.mock.calls.at(-1)?.[0], "data-theme");
    assert.equal(setAttribute.mock.calls.at(-1)?.[1], "dark");
  });

  it("detects the system color scheme preference", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    assert.equal(systemPrefersDark(), true);
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    assert.equal(systemPrefersDark(), false);
  });

  it("returns localized UI strings", () => {
    assert.equal(uiText("zh", "workspace"), "工作区");
    assert.equal(uiText("en", "workspace"), "Workspace");
    assert.equal(uiText("zh", "newProject"), "新建项目");
    assert.equal(uiText("en", "newProject"), "New Project");
  });
});
