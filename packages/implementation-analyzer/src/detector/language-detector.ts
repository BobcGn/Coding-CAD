import path from "node:path";

const LANGUAGE_BY_EXTENSION: Readonly<Record<string, string>> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".py": "Python",
  ".java": "Java",
  ".kt": "Kotlin",
  ".go": "Go",
  ".rs": "Rust"
};

export function detectLanguages(files: readonly string[]): readonly string[] {
  return [...new Set(files.flatMap((file) => {
    const language = LANGUAGE_BY_EXTENSION[path.extname(file).toLowerCase()];
    return language === undefined ? [] : [language];
  }))].sort();
}
