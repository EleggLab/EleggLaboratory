// biome-ignore lint/suspicious/noExplicitAny: Granite requires require.context at runtime.
export const context = (require as any).context('./pages', true, /\.[tj]sx?$/);
