import { Audio } from 'expo-av';

/**
 * Recording preset optimized for Whisper speech recognition (Android-only).
 *
 * Whisper needs 16 kHz mono PCM. The default HIGH_QUALITY preset records at
 * 44.1 kHz stereo — whisper.rn's internal resampler struggles with that,
 * producing garbage transcripts ("gunshot", empty strings, etc.).
 *
 * 16 kHz mono AAC in m4a container eliminates the problematic resampling.
 */
export const WHISPER_RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: false,
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
  },
  ios: {
    extension: '.wav',
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 64000,
  },
};
