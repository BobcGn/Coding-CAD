import type { LLMProvider } from "./provider.js";

export class MockLLMProvider implements LLMProvider {
  async generate(prompt: string): Promise<string> {
    return `mock-architecture-reasoning:${prompt.slice(0, 80)}`;
  }
}
