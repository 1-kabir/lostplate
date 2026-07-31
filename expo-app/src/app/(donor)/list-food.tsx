import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, ScrollView, Pressable, Image, Alert, ActivityIndicator, Modal, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useListingStore } from '../../store/listingStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { apiService } from '../../lib/api';
import { colors, typography, spacing, radius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { CaretLeft, Camera, Trash, Clock as ClockIcon } from 'phosphor-react-native';

const CATEGORIES = ['Cooked Meals', 'Raw Produce', 'Packaged Goods', 'Beverages', 'Bakery'];
const EXPIRY = ['Now', 'Within 2h', 'Within 6h', 'Today'];

// Converts expiry window into ISO timestamp
function expiryWindowToIso(window: string): string {
  const now = new Date();
  switch (window) {
    case 'Now':
      return new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    case 'Within 2h':
      return new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
    case 'Within 6h':
      return new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString();
    case 'Today': {
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 0, 0);
      return endOfDay.toISOString();
    }
    default:
      return new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
  }
}

// "14:00" -> ISO
function timeStringToIso(time: string): string {
  const [hours, minutes] = time.split(':').map((n) => parseInt(n, 10));
  const d = new Date();
  d.setHours(hours || 0, minutes || 0, 0, 0);
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
  return d.toISOString();
}

// Convert 24h format "14:00" to readable 12h format "02:00 PM"
function formatTimeTo12Hour(time24: string): string {
  const [hoursStr, minutesStr] = time24.split(':');
  const h = parseInt(hoursStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${String(h12).padStart(2, '0')}:${minutesStr} ${ampm}`;
}

// Clean Custom Clock Time Picker component
function ClockTimePickerModal({
  visible,
  onClose,
  value,
  onChange,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChange: (val: string) => void;
  title: string;
}) {
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [ampm, setAmpm] = useState('PM');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    if (value && visible) {
      const [hStr, mStr] = value.split(':');
      let hVal = parseInt(hStr, 10);
      const ampmVal = hVal >= 12 ? 'PM' : 'AM';
      let h12 = hVal % 12;
      if (h12 === 0) h12 = 12;
      setHour(String(h12).padStart(2, '0'));
      setMinute(mStr);
      setAmpm(ampmVal);
    }
  }, [value, visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 180,
        useNativeDriver: true,
      })
    ]).start(({ finished }) => {
      if (finished) {
        onClose();
      }
    });
  };

  const handleSave = () => {
    let hVal = parseInt(hour, 10);
    if (ampm === 'PM' && hVal < 12) hVal += 12;
    if (ampm === 'AM' && hVal === 12) hVal = 0;
    onChange(`${String(hVal).padStart(2, '0')}:${minute}`);
    handleClose();
  };

  const hoursList = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutesList = ['00', '15', '30', '45'];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={pickerStyles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(26,43,60,0.5)', opacity: fadeAnim }]} />
        <Animated.View style={[pickerStyles.card, { transform: [{ translateY: slideAnim }] }]}>
          <Text style={pickerStyles.title}>{title}</Text>
          
          <View style={pickerStyles.wheelsRow}>
            {/* Hour Wheel */}
            <View style={pickerStyles.wheelCol}>
              <Text style={pickerStyles.wheelLabel}>Hour</Text>
              <ScrollView style={pickerStyles.wheelScroll} nestedScrollEnabled>
                {hoursList.map(h => (
                  <Pressable
                    key={h}
                    style={[pickerStyles.wheelItem, hour === h && pickerStyles.wheelItemActive]}
                    onPress={() => setHour(h)}
                  >
                    <Text style={[pickerStyles.wheelItemText, hour === h && pickerStyles.wheelItemTextActive]}>{h}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Minute Wheel */}
            <View style={pickerStyles.wheelCol}>
              <Text style={pickerStyles.wheelLabel}>Minute</Text>
              <ScrollView style={pickerStyles.wheelScroll} nestedScrollEnabled>
                {minutesList.map(m => (
                  <Pressable
                    key={m}
                    style={[pickerStyles.wheelItem, minute === m && pickerStyles.wheelItemActive]}
                    onPress={() => setMinute(m)}
                  >
                    <Text style={[pickerStyles.wheelItemText, minute === m && pickerStyles.wheelItemTextActive]}>{m}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* AM/PM Column */}
            <View style={pickerStyles.ampmCol}>
              {['AM', 'PM'].map(a => (
                <Pressable
                  key={a}
                  style={[pickerStyles.ampmBtn, ampm === a && pickerStyles.ampmBtnActive]}
                  onPress={() => setAmpm(a)}
                >
                  <Text style={[pickerStyles.ampmBtnText, ampm === a && pickerStyles.ampmBtnTextActive]}>{a}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={pickerStyles.btnRow}>
            <Pressable style={pickerStyles.cancelBtn} onPress={handleClose}>
              <Text style={pickerStyles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={pickerStyles.saveBtn} onPress={handleSave}>
              <Text style={pickerStyles.saveText}>Set Time</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(26,43,60,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 20,
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: 18,
    color: colors.neutral900,
    textAlign: 'center',
  },
  wheelsRow: {
    flexDirection: 'row',
    height: 180,
    gap: 16,
  },
  wheelCol: {
    flex: 1,
    gap: 8,
  },
  wheelLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: 12,
    color: colors.neutral400,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  wheelScroll: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.neutral100,
    borderRadius: 12,
    backgroundColor: colors.neutral50,
  },
  wheelItem: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  wheelItemActive: {
    backgroundColor: colors.blue500,
  },
  wheelItemText: {
    fontFamily: typography.fonts.medium,
    fontSize: 15,
    color: colors.neutral900,
  },
  wheelItemTextActive: {
    color: colors.white,
    fontFamily: typography.fonts.bold,
  },
  ampmCol: {
    width: 60,
    justifyContent: 'center',
    gap: 12,
  },
  ampmBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral200,
    alignItems: 'center',
    backgroundColor: colors.neutral50,
  },
  ampmBtnActive: {
    backgroundColor: colors.blue500,
    borderColor: colors.blue500,
  },
  ampmBtnText: {
    fontFamily: typography.fonts.bold,
    fontSize: 14,
    color: colors.neutral900,
  },
  ampmBtnTextActive: {
    color: colors.white,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral50,
    borderWidth: 1,
    borderColor: colors.neutral200,
  },
  cancelText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 14,
    color: colors.neutral600,
  },
  saveBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.blue500,
  },
  saveText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 14,
    color: colors.white,
  },
});

export default function ListFoodScreen() {
  const router = useRouter();
  const { addListing } = useListingStore();
  const { user } = useAuthStore();

  const [foodName, setFoodName] = useState('');
  const [category, setCategory] = useState('Cooked Meals');
  const [qty, setQty] = useState('10');
  const [expiry, setExpiry] = useState('Within 2h');

  // Timepicker values (Format: "HH:MM" 24-hour style internally)
  const [pickupStart, setPickupStart] = useState('14:00');
  const [pickupEnd, setPickupEnd] = useState('18:00');
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);

  // Multi-image state
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to attach listing photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUris(prev => [...prev, result.assets[0].uri]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUris(prev => prev.filter((_, i) => i !== index));
  };

  // Uploads all photos and returns a serialized JSON string array of public URLs
  const uploadPhotos = async (): Promise<string | null> => {
    if (photoUris.length === 0 || !user) return null;
    try {
      const urls: string[] = [];
      for (const uri of photoUris) {
        const response = await fetch(uri);
        const arrayBuffer = await response.arrayBuffer();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const { error } = await supabase.storage
          .from('listing-photos')
          .upload(fileName, arrayBuffer, { contentType: 'image/jpeg' });
        
        if (error) {
          console.warn('Individual photo upload failed:', error.message);
          continue;
        }
        const { data } = supabase.storage.from('listing-photos').getPublicUrl(fileName);
        urls.push(data.publicUrl);
      }
      return urls.length > 0 ? JSON.stringify(urls) : null;
    } catch (err) {
      console.warn('Photos upload failed:', err);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!foodName.trim()) return;
    setSubmitting(true);

    const photoUrl = await uploadPhotos();

    const result = await addListing({
      foodName: foodName.trim(),
      category,
      qtyKg: parseInt(qty, 10) || 0,
      expiryWindow: expiry,
      expiryAt: expiryWindowToIso(expiry),
      pickupWindowStart: timeStringToIso(pickupStart),
      pickupWindowEnd: timeStringToIso(pickupEnd),
      photoUrl,
    });

    if (result.error) {
      setSubmitting(false);
      Alert.alert('Could not publish listing', result.error);
      return;
    }

    if (result.id) {
      apiService.getSmartMatches(result.id).catch(() => {});
    }

    setSubmitting(false);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <CaretLeft color={colors.neutral900} size={24} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>List Food</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>What are you donating?</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2 trays of Chicken Biryani"
          placeholderTextColor={colors.neutral400}
          value={foodName}
          onChangeText={setFoodName}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.chipsContainer}>
          {CATEGORIES.map(cat => (
            <Pressable
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Quantity (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 10"
          placeholderTextColor={colors.neutral400}
          keyboardType="numeric"
          value={qty}
          onChangeText={setQty}
        />

        <Text style={styles.label}>Expiry Window</Text>
        <View style={styles.chipsContainer}>
          {EXPIRY.map(exp => (
            <Pressable
              key={exp}
              style={[styles.chip, expiry === exp && styles.chipActive]}
              onPress={() => setExpiry(exp)}
            >
              <Text style={[styles.chipText, expiry === exp && styles.chipTextActive]}>{exp}</Text>
            </Pressable>
          ))}
        </View>

        {/* Pickup Time Selection via custom clock pickers */}
        <Text style={styles.label}>Pickup Window</Text>
        <View style={styles.timeRow}>
          <Pressable style={styles.timeCol} onPress={() => setActivePicker('start')}>
            <Text style={styles.subLabel}>Start Time</Text>
            <View style={styles.timePickerBtn}>
              <ClockIcon size={18} color={colors.neutral600} />
              <Text style={styles.timePickerBtnText}>{formatTimeTo12Hour(pickupStart)}</Text>
            </View>
          </Pressable>

          <Pressable style={styles.timeCol} onPress={() => setActivePicker('end')}>
            <Text style={styles.subLabel}>End Time</Text>
            <View style={styles.timePickerBtn}>
              <ClockIcon size={18} color={colors.neutral600} />
              <Text style={styles.timePickerBtnText}>{formatTimeTo12Hour(pickupEnd)}</Text>
            </View>
          </Pressable>
        </View>

        {/* Multi-Image Attachment UI */}
        <Text style={styles.label}>Listing Photos</Text>
        {photoUris.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoList}>
            {photoUris.map((uri, idx) => (
              <View key={idx} style={styles.photoContainer}>
                <Image source={{ uri }} style={styles.photoItem} />
                <Pressable style={styles.removePhotoBtn} onPress={() => handleRemovePhoto(idx)}>
                  <Trash size={14} color={colors.white} weight="fill" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}

        <Pressable style={styles.photoBox} onPress={handlePickPhoto}>
          <View style={styles.photoInner}>
            <Camera color={colors.neutral400} size={22} weight="regular" />
            <Text style={styles.photoText}>Tap to add listing photo</Text>
          </View>
        </Pressable>

        <View style={{ marginTop: spacing.s40 }}>
          <Button
            label={submitting ? 'Publishing…' : 'Publish Listing'}
            onPress={handleSubmit}
            disabled={submitting || !foodName.trim()}
          />
        </View>
      </ScrollView>

      {/* Clock Time Picker Modals */}
      <ClockTimePickerModal
        visible={activePicker === 'start'}
        onClose={() => setActivePicker(null)}
        value={pickupStart}
        onChange={setPickupStart}
        title="Select Start Time"
      />
      <ClockTimePickerModal
        visible={activePicker === 'end'}
        onClose={() => setActivePicker(null)}
        value={pickupEnd}
        onChange={setPickupEnd}
        title="Select End Time"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.screenHorizontal, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.neutral100 },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontFamily: typography.fonts.bold, fontSize: typography.size.md.fontSize, color: colors.neutral900 },
  content: { padding: spacing.screenHorizontal, paddingBottom: 48 },
  label: { fontFamily: typography.fonts.semiBold, fontSize: typography.size.base.fontSize, color: colors.neutral900, marginTop: spacing.s24, marginBottom: spacing.s12 },
  subLabel: { fontFamily: typography.fonts.medium, fontSize: typography.size.xs.fontSize, color: colors.neutral600, marginBottom: 6 },
  input: { backgroundColor: colors.neutral50, borderWidth: 1, borderColor: colors.neutral200, borderRadius: radius.input, height: 56, paddingHorizontal: 16, fontFamily: typography.fonts.regular, fontSize: 15, color: colors.neutral900 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.neutral50, borderWidth: 1, borderColor: colors.neutral200 },
  chipActive: { backgroundColor: colors.blue400, borderColor: colors.blue400 },
  chipText: { fontFamily: typography.fonts.medium, fontSize: typography.size.sm.fontSize, color: colors.neutral600 },
  chipTextActive: { color: colors.white },
  timeRow: { flexDirection: 'row', gap: 12 },
  timeCol: { flex: 1 },
  timePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.neutral50, borderWidth: 1, borderColor: colors.neutral200, borderRadius: radius.input, height: 48, paddingHorizontal: 12 },
  timePickerBtnText: { fontFamily: typography.fonts.regular, fontSize: 14, color: colors.neutral900 },
  photoList: { gap: 12, marginBottom: 12 },
  photoContainer: { position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden' },
  photoItem: { width: '100%', height: '100%' },
  removePhotoBtn: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  photoBox: { height: 100, backgroundColor: colors.neutral50, borderRadius: radius.card, borderWidth: 1, borderColor: colors.neutral200, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  photoInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  photoText: { fontFamily: typography.fonts.medium, fontSize: typography.size.sm.fontSize, color: colors.neutral400 },
});
