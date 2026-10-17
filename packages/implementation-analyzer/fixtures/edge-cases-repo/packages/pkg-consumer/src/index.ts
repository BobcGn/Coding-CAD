export async function loadDynamically(): Promise<unknown> {
  const mod = await import("@edge/pkg-core");
  return mod;
}
