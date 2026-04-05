import React, { useState, useCallback } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

interface SpeakWordButtonProps {
  word: string;
  accentColor: string;
}

export default function SpeakWordButton({ word, accentColor }: SpeakWordButtonProps) {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = useCallback(() => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(word, {
      language: 'en-US',
      rate: 0.85,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [word, speaking]);

  return (
    <Pressable
      onPress={handleSpeak}
      className="w-8 h-8 rounded-full items-center justify-center"
      style={{ backgroundColor: accentColor + '18' }}
    >
      <Ionicons
        name={speaking ? 'volume-high' : 'volume-medium'}
        size={16}
        color={accentColor}
      />
    </Pressable>
  );
}
