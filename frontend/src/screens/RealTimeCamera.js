import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import PostureService from '../services/postureService';
import WebSocketService from '../services/websocketService';
import { COLORS, SHADOWS, SIZES, SPACING } from '../theme';

const CONNECTIONS = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getPrimaryIssue = (analysis) => analysis?.issues?.[0] || '';

const getCorrectionMeta = (issue = '') => {
  const lower = issue.toLowerCase();

  if (lower.includes('head') || lower.includes('chin') || lower.includes('neck')) {
    return {
      icon: 'head-sync-outline',
      title: 'Set your head line',
      cue: 'Pull the chin slightly back and stack your ears over your shoulders.',
      focus: 'Neck',
    };
  }

  if (lower.includes('spine') || lower.includes('back')) {
    return {
      icon: 'human-handsdown',
      title: 'Brace the torso',
      cue: 'Lift the chest gently, tighten your core, and keep the spine long.',
      focus: 'Spine',
    };
  }

  if (lower.includes('knee') || lower.includes('leg')) {
    return {
      icon: 'human',
      title: 'Track the knees',
      cue: 'Keep both knees pointing over the toes and move with control.',
      focus: 'Knees',
    };
  }

  if (lower.includes('shoulder')) {
    return {
      icon: 'arm-flex-outline',
      title: 'Level the shoulders',
      cue: 'Relax the traps, pull shoulder blades back, and keep both sides even.',
      focus: 'Shoulders',
    };
  }

  return {
    icon: 'target',
    title: 'Hold the correction',
    cue: issue || 'Stay tall, breathe steadily, and move through the rep slowly.',
    focus: 'Full body',
  };
};

const Line = ({ start, end, width, height, color }) => {
  const x1 = start.x * width;
  const y1 = start.y * height;
  const x2 = end.x * width;
  const y2 = end.y * height;
  const length = Math.hypot(x2 - x1, y2 - y1);
  const angle = `${Math.atan2(y2 - y1, x2 - x1)}rad`;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.skeletonLine,
        {
          width: length,
          backgroundColor: color,
          transform: [{ translateX: x1 }, { translateY: y1 }, { rotate: angle }],
        },
      ]}
    />
  );
};

const LandmarkOverlay = ({ landmarks, layout, score }) => {
  const visibleLandmarks = useMemo(
    () => (landmarks || []).filter((point) => point.visibility === undefined || point.visibility > 0.35),
    [landmarks]
  );

  if (!layout.width || !layout.height || visibleLandmarks.length === 0) {
    return null;
  }

  const color = score >= 85 ? 'rgba(75, 181, 111, 0.86)' : score >= 65 ? 'rgba(245, 166, 35, 0.9)' : 'rgba(232, 87, 76, 0.92)';
  const byIndex = new Map(visibleLandmarks.map((point) => [point.index, point]));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {CONNECTIONS.map(([from, to]) => {
        const start = byIndex.get(from);
        const end = byIndex.get(to);

        if (!start || !end) {
          return null;
        }

        return <Line key={`${from}-${to}`} start={start} end={end} width={layout.width} height={layout.height} color={color} />;
      })}

      {visibleLandmarks.map((point) => (
        <View
          key={point.index}
          style={[
            styles.landmarkDot,
            {
              left: point.x * layout.width - 3,
              top: point.y * layout.height - 3,
              borderColor: color,
            },
          ]}
        />
      ))}
    </View>
  );
};

const RealTimeCamera = ({ route }) => {
  const { userId = 'guest', exercise = 'squat' } = route.params || {};
  const cameraRef = useRef(null);
  const captureIntervalRef = useRef(null);
  const lastSpokenRef = useRef(0);
  const [permission, requestPermission] = useCameraPermissions();
  const [analysis, setAnalysis] = useState({ score: 100, issues: [], angles: {}, landmarks: [] });
  const [isActive, setIsActive] = useState(true);
  const [connectionState, setConnectionState] = useState('connecting');
  const [statusMessage, setStatusMessage] = useState('Preparing camera and posture service...');
  const [isUploading, setIsUploading] = useState(false);
  const [mediaSummary, setMediaSummary] = useState(null);
  const [dietVisible, setDietVisible] = useState(false);
  const [workoutVisible, setWorkoutVisible] = useState(false);
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const primaryIssue = getPrimaryIssue(analysis);
  const correction = getCorrectionMeta(primaryIssue);
  const score = clamp(Number(analysis.score) || 0, 0, 100);
  const scoreColor = score >= 85 ? COLORS.success : score >= 65 ? COLORS.warning : COLORS.error;
  const hasIssues = analysis.issues?.length > 0;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: hasIssues ? 1 : 0,
      friction: 7,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [hasIssues, slideAnim]);

  const applyAnalysis = (data, sourceLabel = 'Live posture analysis') => {
    setAnalysis({
      score: data.score ?? 0,
      issues: data.issues ?? [],
      angles: data.angles ?? {},
      landmarks: data.landmarks ?? [],
      frames: data.frames ?? [],
    });

    if (data.error) {
      setStatusMessage(data.error);
      return;
    }

    setStatusMessage(sourceLabel);

    if (data.issues?.length > 0) {
      const now = Date.now();
      if (now - lastSpokenRef.current > 6500) {
        Speech.speak(getCorrectionMeta(data.issues[0]).cue, { rate: 0.88, pitch: 1.05 });
        lastSpokenRef.current = now;
      }
    }
  };

  const handleUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      base64: true,
      quality: 0.65,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    setIsUploading(true);
    setIsActive(false);
    setMediaSummary(null);
    setStatusMessage('Analyzing uploaded media...');

    try {
      const isVideo = asset.type === 'video' || asset.uri?.toLowerCase().match(/\.(mp4|mov|m4v)$/);
      const data = isVideo
        ? await PostureService.analyzeVideo({ uri: asset.uri, userId, exercise })
        : await PostureService.analyzeImage({ base64: asset.base64, userId, exercise });

      applyAnalysis(data, isVideo ? 'Uploaded video analysis complete.' : 'Uploaded image analysis complete.');
      setMediaSummary({
        type: isVideo ? 'Video' : 'Image',
        frames: data.frames?.length || (isVideo ? 0 : 1),
        sessionId: data.sessionId,
      });
    } catch (error) {
      setStatusMessage(error.message || 'Media analysis failed.');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      const permissionResponse = permission?.granted ? permission : await requestPermission();

      if (!permissionResponse?.granted) {
        if (isMounted) {
          setStatusMessage('Camera permission is required to analyze posture.');
          setConnectionState('permission-denied');
        }
        return;
      }

      try {
        await PostureService.getHealth();
        if (isMounted) {
          setStatusMessage('Posture service connected. Starting live feedback...');
        }
      } catch (error) {
        if (isMounted) {
          setStatusMessage('Posture service is unreachable. Start the Python service and keep this device on the same network.');
          setConnectionState('backend-unreachable');
        }
      }

      WebSocketService.connect(
        userId,
        exercise,
        (data) => {
          if (isMounted) {
            applyAnalysis(data, 'Receiving live posture analysis.');
          }
        },
        (nextState) => {
          if (!isMounted) {
            return;
          }

          setConnectionState(nextState);

          if (nextState === 'connecting') {
            setStatusMessage('Connecting to posture analysis...');
          } else if (nextState === 'connected') {
            setStatusMessage('Live posture connection established.');
          } else if (nextState === 'error' || nextState === 'disconnected') {
            setStatusMessage('Connection dropped. Verify that the posture service is reachable.');
          }
        }
      );
    };

    setup();

    return () => {
      isMounted = false;
      clearInterval(captureIntervalRef.current);
      WebSocketService.disconnect();
    };
  }, [exercise, permission?.granted, userId]);

  useEffect(() => {
    clearInterval(captureIntervalRef.current);

    if (!isActive) {
      return undefined;
    }

    captureIntervalRef.current = setInterval(async () => {
      const camera = cameraRef.current;

      if (!camera || !WebSocketService.isConnected()) {
        return;
      }

      try {
        const photo = await camera.takePictureAsync({
          base64: true,
          quality: 0.35,
          skipProcessing: true,
        });

        if (photo?.base64) {
          WebSocketService.sendFrame(photo.base64);
        }
      } catch (error) {
        setStatusMessage('Frame capture paused. Hold the device steady and try again.');
      }
    }, 950);

    return () => {
      clearInterval(captureIntervalRef.current);
    };
  }, [isActive]);

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.statusText}>Loading camera permissions...</Text>
      </View>
    );
  }

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.08] });
  const coachTranslate = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraLayer} onLayout={(event) => setCameraLayout(event.nativeEvent.layout)}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" active={isActive} mute />
        <LandmarkOverlay landmarks={analysis.landmarks} layout={cameraLayout} score={score} />
        <View style={styles.vignette} pointerEvents="none" />
      </View>

      <View style={styles.overlay}>
        <View style={styles.header}>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => setIsActive((value) => !value)} activeOpacity={0.82}>
              <Icon name={isActive ? 'pause' : 'play'} size={24} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleUpload} activeOpacity={0.82} disabled={isUploading}>
              {isUploading ? <ActivityIndicator color={COLORS.white} size="small" /> : <Icon name="tray-arrow-up" size={24} color={COLORS.white} />}
            </TouchableOpacity>
          </View>

          <View style={[styles.scoreBadge, { borderColor: scoreColor }]}>
            <Text style={[styles.scoreText, { color: scoreColor }]}>{score}</Text>
            <Text style={styles.scoreLabel}>score</Text>
          </View>
        </View>

        <View style={styles.connectionBanner}>
          <View style={[styles.statusDot, { backgroundColor: connectionState === 'connected' ? COLORS.success : COLORS.warning }]} />
          <View style={styles.connectionCopy}>
            <Text style={styles.connectionTitle}>{connectionState.replace('-', ' ')}</Text>
            <Text style={styles.connectionText}>{statusMessage}</Text>
          </View>
        </View>

        <View style={styles.middleSpace}>
          {hasIssues ? (
            <Animated.View
              style={[
                styles.coachCard,
                {
                  opacity: slideAnim,
                  transform: [{ translateY: coachTranslate }],
                },
              ]}
            >
              <View style={styles.correctionVisual}>
                <Animated.View style={[styles.pulseRing, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />
                <View style={styles.correctionIcon}>
                  <Icon name={correction.icon} size={30} color={COLORS.white} />
                </View>
              </View>
              <View style={styles.coachCopy}>
                <Text style={styles.coachEyebrow}>{correction.focus} correction</Text>
                <Text style={styles.coachTitle}>{correction.title}</Text>
                <Text style={styles.coachText}>{correction.cue}</Text>
              </View>
            </Animated.View>
          ) : (
            <View style={styles.goodCard}>
              <Icon name="check-decagram-outline" size={26} color={COLORS.success} />
              <View style={styles.coachCopy}>
                <Text style={styles.coachTitle}>Form is holding</Text>
                <Text style={styles.coachText}>Keep the movement slow and stay inside the frame.</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.bottomPanel}>
          <View style={styles.metricsContainer}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{analysis.angles?.neck_tilt || 0} deg</Text>
              <Text style={styles.metricLabel}>Neck</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{analysis.angles?.spine || 0} deg</Text>
              <Text style={styles.metricLabel}>Spine</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{analysis.angles?.left_knee || 0} deg</Text>
              <Text style={styles.metricLabel}>Knee</Text>
            </View>
          </View>

          {mediaSummary ? (
            <View style={styles.mediaSummary}>
              <Icon name="file-check-outline" size={18} color={COLORS.primary} />
              <Text style={styles.mediaSummaryText}>
                {mediaSummary.type} checked{mediaSummary.frames ? ` across ${mediaSummary.frames} sample${mediaSummary.frames === 1 ? '' : 's'}` : ''}
              </Text>
            </View>
          ) : null}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.issueRail}>
            {(analysis.issues?.length ? analysis.issues : ['No correction needed right now']).map((issue, index) => (
              <View key={`${issue}-${index}`} style={[styles.issueChip, !hasIssues && styles.issueChipGood]}>
                <Icon name={hasIssues ? 'alert-circle-outline' : 'check-circle-outline'} size={16} color={hasIssues ? COLORS.warning : COLORS.success} />
                <Text style={styles.issueChipText}>{issue}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => setWorkoutVisible(true)} activeOpacity={0.85}>
              <Icon name="dumbbell" size={22} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => setDietVisible(true)} activeOpacity={0.85}>
              <Icon name="food-apple-outline" size={22} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Diet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={dietVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Diet plan</Text>
              <TouchableOpacity onPress={() => setDietVisible(false)} style={styles.modalClose}>
                <Icon name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.modalText}>Open the Diet tab to generate a Gemini 3 Flash meal plan from your profile.</Text>
              <View style={styles.mealCard}>
                <Text style={styles.mealTitle}>Posture-aware cue</Text>
                <Text style={styles.mealDesc}>After intense correction sessions, prioritize protein, hydration, and steady carbohydrates around training.</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={workoutVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Correction drills</Text>
              <TouchableOpacity onPress={() => setWorkoutVisible(false)} style={styles.modalClose}>
                <Icon name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {(analysis.issues?.length ? analysis.issues : ['Maintain your current form']).map((issue, index) => {
                const meta = getCorrectionMeta(issue);
                return (
                  <View key={`${issue}-${index}`} style={styles.mealCard}>
                    <Text style={styles.mealTitle}>{meta.title}</Text>
                    <Text style={styles.mealDesc}>{meta.cue}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0d10',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0d10',
  },
  cameraLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: SPACING.m,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.s,
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13, 18, 24, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  scoreBadge: {
    width: 70,
    height: 70,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13, 18, 24, 0.78)',
    borderWidth: 1,
    ...SHADOWS.medium,
  },
  scoreText: {
    fontSize: 25,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  scoreLabel: {
    color: 'rgba(255, 255, 255, 0.68)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusText: {
    color: COLORS.white,
    fontSize: SIZES.fontBody,
    textAlign: 'center',
    marginTop: SPACING.m,
  },
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(13, 18, 24, 0.72)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    padding: SPACING.m,
    marginTop: SPACING.s,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginTop: 5,
    marginRight: SPACING.s,
  },
  connectionCopy: {
    flex: 1,
  },
  connectionTitle: {
    color: COLORS.white,
    fontSize: SIZES.fontSmall,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  connectionText: {
    color: 'rgba(255, 255, 255, 0.76)',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  middleSpace: {
    flex: 1,
    justifyContent: 'center',
  },
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 20, 27, 0.84)',
    borderRadius: 22,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.34)',
  },
  goodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 32, 24, 0.76)',
    borderRadius: 22,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: 'rgba(75, 181, 111, 0.32)',
  },
  correctionVisual: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.m,
  },
  pulseRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.warning,
  },
  correctionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  coachCopy: {
    flex: 1,
  },
  coachEyebrow: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  coachTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  coachText: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  bottomPanel: {
    backgroundColor: 'rgba(13, 18, 24, 0.78)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    padding: SPACING.m,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    flex: 1,
    paddingVertical: SPACING.s,
  },
  metricValue: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: 12,
    marginTop: 3,
  },
  mediaSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.s,
  },
  mediaSummaryText: {
    color: 'rgba(255, 255, 255, 0.76)',
    marginLeft: SPACING.xs,
    fontSize: 13,
  },
  issueRail: {
    marginTop: SPACING.m,
  },
  issueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 280,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 166, 35, 0.13)',
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.28)',
    marginRight: SPACING.s,
  },
  issueChipGood: {
    backgroundColor: 'rgba(75, 181, 111, 0.14)',
    borderColor: 'rgba(75, 181, 111, 0.3)',
  },
  issueChipText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.s,
    marginTop: SPACING.m,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: SPACING.m,
    borderRadius: 16,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    padding: SPACING.m,
    borderRadius: 16,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontBody,
    fontWeight: '800',
    marginLeft: SPACING.xs,
  },
  skeletonLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 3,
    borderRadius: 2,
    transformOrigin: '0px 1.5px',
  },
  landmarkDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#141922',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.l,
    minHeight: '46%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.m,
  },
  modalTitle: {
    fontSize: SIZES.fontTitle,
    color: COLORS.white,
    fontWeight: '800',
  },
  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: SIZES.fontBody,
    marginBottom: SPACING.m,
    lineHeight: 22,
  },
  mealCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: SPACING.m,
    borderRadius: 16,
    marginBottom: SPACING.s,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mealTitle: {
    color: COLORS.white,
    fontSize: SIZES.fontBody,
    fontWeight: '800',
    marginBottom: 4,
  },
  mealDesc: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: SIZES.fontSmall,
    lineHeight: 20,
  },
});

export default RealTimeCamera;
