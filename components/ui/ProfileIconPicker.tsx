import React from 'react';
import { View, Text, Modal, Pressable, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PROFILE_ICONS, PROFILE_ICON_IDS } from '@/assets/icons/profile';

interface Props {
  visible: boolean;
  selectedId?: number;
  onSelect: (id: number) => void;
  onClose: () => void;
}

const COLUMNS = 3;
const SCREEN_W = Dimensions.get('window').width;
// modal has px-6 (24px each side) + inner p-4 (16px each side) = 80px total horizontal space
const ICON_SIZE = Math.floor((SCREEN_W - 80 - (COLUMNS - 1) * 12) / COLUMNS);

// Split flat list into rows of COLUMNS
const ROWS: number[][] = [];
for (let i = 0; i < PROFILE_ICON_IDS.length; i += COLUMNS) {
  ROWS.push(PROFILE_ICON_IDS.slice(i, i + COLUMNS));
}

export default function ProfileIconPicker({ visible, selectedId, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center px-6"
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()} style={{ width: '100%' }}>
          <View className="bg-white rounded-2xl overflow-hidden w-full">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <Text className="text-lg font-bold text-text-primary">Choose Profile Icon</Text>
              <Pressable onPress={onClose} className="p-1 active:opacity-60">
                <Ionicons name="close" size={24} color="#546E7A" />
              </Pressable>
            </View>

            {/* Grid */}
            <View className="p-4" style={{ gap: 12 }}>
              {ROWS.map((row, rowIdx) => (
                <View key={rowIdx} style={{ flexDirection: 'row', gap: 12 }}>
                  {row.map((id) => {
                    const selected = id === selectedId;
                    return (
                      <Pressable
                        key={id}
                        onPress={() => onSelect(id)}
                        style={{ width: ICON_SIZE, height: ICON_SIZE }}
                        className="active:opacity-70"
                      >
                        <View
                          style={{
                            width: ICON_SIZE,
                            height: ICON_SIZE,
                            borderRadius: ICON_SIZE / 2,
                            overflow: 'hidden',
                            borderWidth: selected ? 4 : 2,
                            borderColor: selected ? '#2196F3' : '#E0E0E0',
                          }}
                        >
                          <Image
                            source={PROFILE_ICONS[id]}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                        </View>
                        {selected && (
                          <View
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                              width: 22,
                              height: 22,
                              borderRadius: 11,
                              backgroundColor: '#2196F3',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderWidth: 2,
                              borderColor: '#fff',
                            }}
                          >
                            <Ionicons name="checkmark" size={13} color="#fff" />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Remove icon option */}
            {selectedId != null && (
              <Pressable
                onPress={() => onSelect(0)}
                className="mx-4 mb-4 py-3 rounded-xl border border-border items-center active:opacity-70"
              >
                <Text className="text-sm text-text-secondary font-medium">Use initials instead</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
