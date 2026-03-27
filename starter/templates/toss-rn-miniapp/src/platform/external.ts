import { Linking } from 'react-native';

let openUrlImpl: ((url: string) => Promise<unknown> | unknown) | null = null;
try {
  openUrlImpl = require('@apps-in-toss/framework').openURL ?? null;
} catch {
  openUrlImpl = null;
}

export async function openExternalUrl(url: string): Promise<void> {
  if (openUrlImpl) {
    await openUrlImpl(url);
    return;
  }

  await Linking.openURL(url);
}
