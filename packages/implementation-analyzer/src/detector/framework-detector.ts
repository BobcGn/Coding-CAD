const FRAMEWORKS: Readonly<Record<string, string>> = {
  "@nestjs/core": "NestJS",
  express: "Express",
  fastify: "Fastify",
  koa: "Koa",
  next: "Next.js",
  react: "React",
  vue: "Vue",
  "@angular/core": "Angular"
};

export function detectFrameworks(dependencies: readonly string[]): readonly string[] {
  return [...new Set(dependencies.flatMap((dependency) => {
    const framework = FRAMEWORKS[dependency.toLowerCase()];
    return framework === undefined ? [] : [framework];
  }))].sort();
}
