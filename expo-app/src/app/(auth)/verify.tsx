import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Image,
  Animated,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import {
  FileText,
  IdentificationCard,
  Buildings,
  CheckCircle,
  Clock,
  ArrowRight,
  Lightning,
} from 'phosphor-react-native';

type VerifyState = 'form' | 'submitted';

const DOC_TYPES = [
  {
    key: 'registration',
    icon: Buildings,
    label: 'Business / NGO Registration',
    sublabel: 'Certificate of incorporation or registration',
  },
  {
    key: 'identity',
    icon: IdentificationCard,
    label: 'Owner / Director ID',
    sublabel: 'Government-issued photo ID',
  },
  {
    key: 'legal',
    icon: FileText,
    label: 'Legal Address Proof',
    sublabel: 'Utility bill or official correspondence',
  },
];

const DEMO_SECONDS = 30;

export default function VerifyScreen() {
  const { user, submitVerification, approveVerification } = useAuthStore();
  const [verifyState, setVerifyState] = useState<VerifyState>(
    user?.verificationStatus === 'pending' ? 'submitted' : 'form'
  );
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(DEMO_SECONDS);
  const [approved, setApproved] = useState(false);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start the countdown as soon as we enter submitted state
  useEffect(() => {
    if (verifyState !== 'submitted' || approved) return;

    // Animate the progress bar from full → empty over DEMO_SECONDS
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: DEMO_SECONDS * 1000,
      useNativeDriver: false,
    }).start();

    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          handleAutoApprove();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [verifyState]);

  const handleAutoApprove = async () => {
    if (approved) return;
    setApproved(true);
    if (timerRef.current) clearInterval(timerRef.current);
    await approveVerification();
  };

  const toggleUpload = (key: string) => {
    setUploaded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allUploaded = DOC_TYPES.every((d) => uploaded[d.key]);

  const handleSubmit = async () => {
    await submitVerification();
    setVerifyState('submitted');
  };

  if (verifyState === 'submitted') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.pendingContent}>
          {/* Status icon */}
          <View style={[styles.pendingIconWrap, approved && styles.pendingIconWrapApproved]}>
            {approved
              ? <CheckCircle color={colors.green} size={48} weight="fill" />
              : <Clock color={colors.amber} size={48} weight="fill" />
            }
          </View>

          <Text style={styles.pendingTitle}>
            {approved ? 'Account Approved!' : 'Application Submitted'}
          </Text>
          <Text style={styles.pendingSubtitle}>
            {approved
              ? `Welcome to Lost Plate, ${user?.name?.split(' ')[0] ?? 'there'}. You're now verified and ready to go.`
              : <>
                  Our team will review your documents and verify your account within{' '}
                  <Text style={styles.pendingHighlight}>1–2 business days.</Text>
                  {'\n\n'}
                  You'll receive an email at{' '}
                  <Text style={styles.pendingHighlight}>{user?.email}</Text> once
                  your account is approved.
                </>
            }
          </Text>

          <View style={styles.timelineCard}>
            <TimelineRow
              icon={<CheckCircle color={colors.blue400} size={18} weight="fill" />}
              label="Application submitted"
              sub="Just now"
              done
            />
            <TimelineRow
              icon={<Clock color={approved ? colors.blue400 : colors.neutral400} size={18} weight={approved ? 'fill' : 'regular'} />}
              label="Documents under review"
              sub={approved ? 'Completed' : '1–2 business days'}
              done={approved}
            />
            <TimelineRow
              icon={<CheckCircle color={approved ? colors.green : colors.neutral200} size={18} weight="fill" />}
              label="Account approved"
              sub={approved ? 'Just now ✓' : 'You\'ll get an email'}
              done={approved}
              last
            />
          </View>

          {/* Auto-approval countdown */}
          {!approved && (
            <View style={styles.demoCard}>
              <View style={styles.demoCardHeader}>
                <Lightning color={colors.amber} size={16} weight="fill" />
                <Text style={styles.demoCardTitle}>Auto-approving in <Text style={styles.demoCountdown}>{secondsLeft}s</Text></Text>
              </View>

              {/* Progress bar */}
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>

              <Pressable style={styles.skipBtn} onPress={handleAutoApprove}>
                <Text style={styles.skipBtnText}>Skip wait →</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image
            source={require('../../../assets/images/logo1.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>One last step.</Text>
        <Text style={styles.subtitle}>
          To connect {user?.type === 'donor' ? 'donors' : 'NGOs'} with verified
          partners, we need to confirm your organisation's legitimacy. Upload the
          documents below — this takes under 2 minutes.
        </Text>

        <View style={styles.docList}>
          {DOC_TYPES.map((doc) => {
            const Icon = doc.icon;
            const isUploaded = uploaded[doc.key];
            return (
              <Pressable
                key={doc.key}
                style={[styles.docCard, isUploaded && styles.docCardUploaded]}
                onPress={() => toggleUpload(doc.key)}
              >
                <View
                  style={[
                    styles.docIconWrap,
                    isUploaded && styles.docIconWrapUploaded,
                  ]}
                >
                  {isUploaded ? (
                    <CheckCircle color={colors.blue400} size={22} weight="fill" />
                  ) : (
                    <Icon color={colors.neutral400} size={22} weight="regular" />
                  )}
                </View>
                <View style={styles.docText}>
                  <Text
                    style={[styles.docLabel, isUploaded && styles.docLabelUploaded]}
                  >
                    {doc.label}
                  </Text>
                  <Text style={styles.docSublabel}>{doc.sublabel}</Text>
                </View>
                <Text style={styles.docAction}>
                  {isUploaded ? 'Uploaded ✓' : 'Tap to upload'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Your documents are encrypted and only reviewed by our compliance team.
            They are never shared with donors or NGOs.
          </Text>
        </View>

        <View style={{ marginTop: spacing.s32 }}>
          <Button
            label="Submit Application"
            onPress={handleSubmit}
            disabled={!allUploaded}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TimelineRow({
  icon,
  label,
  sub,
  done,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  done: boolean;
  last?: boolean;
}) {
  return (
    <View style={timelineStyles.row}>
      <View style={timelineStyles.iconCol}>
        {icon}
        {!last && <View style={timelineStyles.line} />}
      </View>
      <View style={timelineStyles.textCol}>
        <Text
          style={[
            timelineStyles.label,
            !done && timelineStyles.labelMuted,
          ]}
        >
          {label}
        </Text>
        <Text style={timelineStyles.sub}>{sub}</Text>
      </View>
    </View>
  );
}

const timelineStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 14,
  },
  iconCol: {
    alignItems: 'center',
    width: 20,
  },
  line: {
    width: 1.5,
    flex: 1,
    backgroundColor: colors.neutral100,
    marginTop: 4,
    marginBottom: -4,
    minHeight: 24,
  },
  textCol: {
    flex: 1,
    paddingBottom: 20,
  },
  label: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.size.sm.fontSize,
    color: colors.neutral900,
    marginBottom: 2,
  },
  labelMuted: {
    color: colors.neutral400,
  },
  sub: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.xs.fontSize,
    color: colors.neutral400,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral0,
  },

  // Form state
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 32,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 32,
  },
  logoImage: {
    width: 140,
    height: 56,
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.size.xl.fontSize,
    color: colors.neutral900,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.base.fontSize,
    color: colors.neutral600,
    lineHeight: 23,
    marginBottom: 32,
  },
  docList: {
    gap: 12,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.neutral50,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral100,
    padding: 16,
  },
  docCardUploaded: {
    backgroundColor: colors.blue50,
    borderColor: colors.blue200,
  },
  docIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.neutral100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docIconWrapUploaded: {
    backgroundColor: colors.blue100,
  },
  docText: {
    flex: 1,
  },
  docLabel: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.size.sm.fontSize,
    color: colors.neutral900,
    marginBottom: 2,
  },
  docLabelUploaded: {
    color: colors.blue600,
  },
  docSublabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.xs.fontSize,
    color: colors.neutral400,
  },
  docAction: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.size.xs.fontSize,
    color: colors.neutral400,
  },
  infoBox: {
    marginTop: 20,
    backgroundColor: colors.neutral100,
    borderRadius: radius.card,
    padding: 14,
  },
  infoText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.xs.fontSize,
    color: colors.neutral600,
    lineHeight: 18,
  },

  // Pending state
  pendingContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 64,
    paddingBottom: 48,
  },
  pendingIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.amber + '18',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  pendingTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.size.xl.fontSize,
    color: colors.neutral900,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  pendingSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.base.fontSize,
    color: colors.neutral600,
    lineHeight: 24,
    marginBottom: 36,
  },
  pendingHighlight: {
    fontFamily: typography.fonts.semiBold,
    color: colors.neutral900,
  },
  timelineCard: {
    backgroundColor: colors.neutral50,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral100,
    padding: 20,
    marginBottom: 48,
  },
  pendingIconWrapApproved: {
    backgroundColor: colors.green + '18',
  },
  demoCard: {
    backgroundColor: colors.neutral50,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.amber + '40',
    padding: 16,
    gap: 10,
  },
  demoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demoCardTitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.sm.fontSize,
    color: colors.neutral600,
  },
  demoCardBody: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.size.sm.fontSize,
    color: colors.neutral600,
  },
  demoCountdown: {
    fontFamily: typography.fonts.bold,
    color: colors.neutral900,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.neutral200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.amber,
    borderRadius: 2,
  },
  skipBtn: {
    alignSelf: 'flex-end',
  },
  skipBtnText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.size.sm.fontSize,
    color: colors.blue500,
  },
});
