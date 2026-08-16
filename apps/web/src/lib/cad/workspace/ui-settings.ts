/**
 * Personal UI settings for the Workspace sidebar (P3 closeout).
 *
 * Language and theme preferences are ephemeral UI state persisted in browser
 * localStorage. They never enter Architecture IR, LayoutState, or the
 * Workspace disk format (P3.0 lifecycle matrix).
 *
 * 工作区侧边栏的个人设置（P3 收尾）。语言与主题偏好是持久化到浏览器
 * localStorage 的瞬时 UI 状态；绝不进入 Architecture IR、LayoutState 或
 * Workspace 磁盘格式（P3.0 生命周期矩阵）。
 */

export type ThemeMode = "light" | "dark" | "system";
export type UiLocale = "zh" | "en";

export interface UiSettings {
  readonly theme: ThemeMode;
  readonly locale: UiLocale;
}

export const DEFAULT_UI_SETTINGS: UiSettings = { theme: "system", locale: "en" };

const STORAGE_KEY = "coding-cad-ui-settings";

/** Load persisted settings; falls back to defaults when absent or invalid. */
export function loadUiSettings(): UiSettings {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw === null || raw === undefined) return DEFAULT_UI_SETTINGS;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_UI_SETTINGS;
    const record = parsed as Record<string, unknown>;
    const theme = record.theme;
    const locale = record.locale;
    if (theme !== "light" && theme !== "dark" && theme !== "system") return DEFAULT_UI_SETTINGS;
    if (locale !== "zh" && locale !== "en") return DEFAULT_UI_SETTINGS;
    return { theme, locale };
  } catch {
    return DEFAULT_UI_SETTINGS;
  }
}

/** Persist settings to browser localStorage. */
export function saveUiSettings(settings: UiSettings): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage may be unavailable (e.g. privacy mode); settings stay in memory.
  }
}

/** Resolve a theme mode to a concrete light/dark value. */
export function resolveTheme(mode: ThemeMode, systemPrefersDark: boolean): "light" | "dark" {
  if (mode === "system") return systemPrefersDark ? "dark" : "light";
  return mode;
}

/** Apply the resolved theme to the document root. */
export function applyTheme(mode: ThemeMode, systemPrefersDark: boolean): void {
  const resolved = resolveTheme(mode, systemPrefersDark);
  const root = globalThis.document?.documentElement;
  if (root === undefined) return;
  root.setAttribute("data-theme", resolved);
}

/** Detect the current system color scheme preference. */
export function systemPrefersDark(): boolean {
  return globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

/**
 * Minimal UI string dictionary. Product-facing labels switch with locale;
 * domain text (requirements, validation titles) stays as authored.
 */
export type UiTextKey =
  | "appName"
  | "workspace"
  | "newProject"
  | "save"
  | "open"
  | "autoLayout"
  | "settings"
  | "language"
  | "theme"
  | "themeLight"
  | "themeDark"
  | "themeSystem"
  | "requirement"
  | "generateArchitecture"
  | "generating"
  | "palette"
  | "problems"
  | "inspector"
  | "noValidationIssues"
  | "noSelection"
  | "selected"
  | "emptyRequirementError";

const DICTIONARY: Record<UiLocale, Record<UiTextKey, string>> = {
  zh: {
    appName: "Coding CAD",
    workspace: "工作区",
    newProject: "新建项目",
    save: "保存",
    open: "打开",
    autoLayout: "自动布局",
    settings: "个人设置",
    language: "语言",
    theme: "主题",
    themeLight: "亮色",
    themeDark: "暗色",
    themeSystem: "跟随系统",
    requirement: "需求",
    generateArchitecture: "生成架构",
    generating: "生成中…",
    palette: "组件面板",
    problems: "问题",
    inspector: "检查器",
    noValidationIssues: "无验证问题。",
    noSelection: "未选中",
    selected: "已选中",
    emptyRequirementError: "需求不能为空。",
  },
  en: {
    appName: "Coding CAD",
    workspace: "Workspace",
    newProject: "New Project",
    save: "Save",
    open: "Open",
    autoLayout: "Auto Layout",
    settings: "Personal Settings",
    language: "Language",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    requirement: "Requirement",
    generateArchitecture: "Generate Architecture",
    generating: "Generating…",
    palette: "Palette",
    problems: "Problems",
    inspector: "Inspector",
    noValidationIssues: "No validation issues.",
    noSelection: "No selection",
    selected: "Selected",
    emptyRequirementError: "Requirement must not be empty.",
  },
};

export function uiText(locale: UiLocale, key: UiTextKey): string {
  return DICTIONARY[locale][key];
}
