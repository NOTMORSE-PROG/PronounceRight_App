import { useState, useEffect } from 'react';
import { initWhisper, initWhisperVad } from 'whisper.rn';
import type { WhisperContext, WhisperVadContext } from 'whisper.rn';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

// Bundled in assets/models/ — Metro handles .bin via assetExts config
// eslint-disable-next-line @typescript-eslint/no-require-imports
const WHISPER_ASSET = require('../../assets/models/ggml-base.en-q5_1.bin');
const WHISPER_DEST = 'whisper-base-en.bin';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const VAD_ASSET = require('../../assets/models/ggml-silero-v6.2.0.bin');
const VAD_DEST = 'silero-vad.bin';

export type ModelState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; ctx: WhisperContext; vadCtx: WhisperVadContext | null }
  | { status: 'error'; message: string };

/** Copy a bundled asset from the APK to documentDirectory if not already copied. */
async function ensureAssetCopied(assetModule: number, destFile: string): Promise<string> {
  const base = FileSystem.documentDirectory;
  if (!base) throw new Error('documentDirectory unavailable');
  const destPath = base + destFile;

  const info = await FileSystem.getInfoAsync(destPath);
  if (!info.exists) {
    const asset = Asset.fromModule(assetModule);
    await asset.downloadAsync();
    if (!asset.localUri) throw new Error('Asset localUri unavailable');
    await FileSystem.copyAsync({ from: asset.localUri, to: destPath });
  }
  return destPath;
}

export function useWhisperModel(): ModelState {
  const [state, setState] = useState<ModelState>({ status: 'idle' });

  useEffect(() => {
    let cancelled = false;

    async function initModels() {
      setState({ status: 'loading' });
      try {
        // Extract both models from APK bundle in parallel (first launch only)
        const [whisperPath, vadPath] = await Promise.all([
          ensureAssetCopied(WHISPER_ASSET, WHISPER_DEST),
          ensureAssetCopied(VAD_ASSET, VAD_DEST),
        ]);

        if (cancelled) return;

        // Initialize both contexts in parallel
        const [ctx, vadCtx] = await Promise.all([
          initWhisper({ filePath: whisperPath }),
          initWhisperVad({ filePath: vadPath }).catch(() => null), // VAD is optional — graceful fallback
        ]);

        if (!cancelled) setState({ status: 'ready', ctx, vadCtx });
      } catch {
        if (!cancelled) setState({ status: 'error', message: 'Assessment engine failed to load' });
      }
    }

    initModels();
    return () => { cancelled = true; };
  }, []);

  return state;
}
