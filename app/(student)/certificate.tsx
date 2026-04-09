import React, { useRef, useState } from 'react';
import { View, Text, ImageBackground, Pressable, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '@/stores/auth';

const CERT_ASPECT = 4 / 3; // matches the certificate image

export default function CertificateScreen() {
  const params = useLocalSearchParams<{ from?: string }>();
  const fromProfile = params.from === 'profile';
  const fullName = useAuthStore((s) => s.user?.fullName) ?? 'Student';

  const certRef = useRef<View>(null);
  const [busy, setBusy] = useState<'download' | 'share' | null>(null);

  const screenW = Dimensions.get('window').width;
  const certWidth = Math.min(screenW - 24, 720);
  const certHeight = certWidth / CERT_ASPECT;

  async function handleDownload() {
    if (busy) return;
    try {
      setBusy('download');
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow access to your photo library to save the certificate.');
        return;
      }
      const uri = await captureRef(certRef, { format: 'png', quality: 1 });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved!', 'Your certificate was saved to your gallery.');
    } catch {
      Alert.alert('Could not save', 'Something went wrong while saving the certificate.');
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    if (busy) return;
    try {
      setBusy('share');
      const uri = await captureRef(certRef, { format: 'png', quality: 1 });
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Sharing unavailable', 'Sharing is not available on this device.');
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your certificate' });
    } catch {
      Alert.alert('Could not share', 'Something went wrong while sharing the certificate.');
    } finally {
      setBusy(null);
    }
  }

  function handleDone() {
    if (fromProfile) router.back();
    else router.replace('/(student)/dashboard' as any);
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-page" edges={['top']}>
      <View className="flex-row items-center px-3 py-3 bg-white border-b border-border">
        <Pressable
          onPress={handleDone}
          className="w-10 h-10 items-center justify-center rounded-full"
          hitSlop={8}
        >
          <Ionicons name={fromProfile ? 'chevron-back' : 'close'} size={24} color="#1565C0" />
        </Pressable>
        <Text className="flex-1 text-center text-base font-bold text-text-primary">
          Certificate
        </Text>
        <View className="w-10" />
      </View>

      <View className="flex-1 items-center justify-center px-3">
        {!fromProfile && (
          <View className="items-center mb-3">
            <Text className="text-2xl">🎉</Text>
            <Text className="text-base font-bold text-text-primary mt-1">Congratulations, {fullName.split(' ')[0]}!</Text>
            <Text className="text-xs text-text-muted">You've completed the entire SpeakRight course.</Text>
          </View>
        )}

        {/* Certificate render target */}
        <View
          ref={certRef}
          collapsable={false}
          style={{ width: certWidth, height: certHeight, backgroundColor: 'white' }}
        >
          <ImageBackground
            source={require('@/assets/images/certificate.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          >
            {/* Student name — positioned over the line under "this certify that" */}
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '47%',
                alignItems: 'center',
              }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{
                  fontSize: certWidth * 0.055,
                  fontWeight: '700',
                  color: '#0D47A1',
                  fontStyle: 'italic',
                  maxWidth: certWidth * 0.7,
                  textAlign: 'center',
                }}
              >
                {fullName}
              </Text>
            </View>
          </ImageBackground>
        </View>

        {/* Action buttons */}
        <View className="flex-row gap-2 mt-5 w-full px-2">
          <Pressable
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3.5 active:opacity-80"
            style={{ backgroundColor: '#FFF8E1', borderWidth: 1, borderColor: '#F59E0B' }}
            onPress={handleShare}
            disabled={busy !== null}
          >
            {busy === 'share' ? (
              <ActivityIndicator size="small" color="#F59E0B" />
            ) : (
              <Ionicons name="share-outline" size={18} color="#F59E0B" />
            )}
            <Text className="text-sm font-semibold" style={{ color: '#B45309' }}>Share</Text>
          </Pressable>
          <Pressable
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3.5 active:opacity-80"
            style={{ backgroundColor: '#1565C0' }}
            onPress={handleDownload}
            disabled={busy !== null}
          >
            {busy === 'download' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="download-outline" size={18} color="#fff" />
            )}
            <Text className="text-white font-bold text-sm">Download PNG</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
