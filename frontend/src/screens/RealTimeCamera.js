import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

import PostureService from "../services/postureService";
import WebSocketService from "../services/websocketService";
import { openAppDrawer } from "../navigation/drawer";
import { COLORS } from "../theme";

const angleLabel = {
  neck_tilt: "Neck",
  spine: "Spine",
  left_knee: "Left knee",
  right_knee: "Right knee",
  shoulder_diff: "Shoulders",
};

const getReportTitle = (score = 0) => {
  if (score >= 85) {
    return "Good form";
  }

  if (score >= 65) {
    return "Needs a small correction";
  }

  return "Correct before continuing";
};

const getCorrection = (issue = "") => {
  const lower = issue.toLowerCase();

  if (
    lower.includes("head") ||
    lower.includes("chin") ||
    lower.includes("neck")
  ) {
    return "Bring your chin slightly back and stack your ears over your shoulders.";
  }

  if (lower.includes("spine") || lower.includes("back")) {
    return "Brace your core, lift your chest gently, and keep the spine long.";
  }

  if (lower.includes("knee") || lower.includes("leg")) {
    return "Keep both knees tracking over your toes and slow the movement down.";
  }

  if (lower.includes("shoulder")) {
    return "Relax your traps and level both shoulders before the next rep.";
  }

  return (
    issue || "Move slowly, stay centered in frame, and keep breathing steadily."
  );
};

const ReportModal = ({ visible, analysis, source, onClose }) => {
  const angles = Object.entries(analysis?.angles || {});
  const issues = analysis?.issues?.length
    ? analysis.issues
    : ["No visible posture issue found."];
  const score = analysis?.score ?? 0;
  const isGood = score >= 85 && !analysis?.issues?.length;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.reportSheet}>
          <View style={styles.reportHeader}>
            <View>
              <Text style={styles.kicker}>{source || "Camera analysis"}</Text>
              <Text style={styles.reportTitle}>{getReportTitle(score)}</Text>
            </View>
            <TouchableOpacity
              style={styles.iconButtonDark}
              onPress={onClose}
              activeOpacity={0.84}
            >
              <Icon name="close" size={23} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.scoreRow}>
            <View
              style={[
                styles.scoreCircle,
                { borderColor: isGood ? COLORS.success : COLORS.primary },
              ]}
            >
              <Text
                style={[
                  styles.scoreNumber,
                  { color: isGood ? COLORS.success : COLORS.primary },
                ]}
              >
                {score}
              </Text>
              <Text style={styles.scoreCaption}>score</Text>
            </View>
            <View style={styles.scoreCopy}>
              <Text style={styles.scoreTitle}>
                {isGood ? "Keep this position" : "Main correction"}
              </Text>
              <Text style={styles.scoreText}>{getCorrection(issues[0])}</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Corrections</Text>
            {issues.map((issue, index) => (
              <View key={`${issue}-${index}`} style={styles.reportItem}>
                <Icon
                  name={
                    isGood ? "check-circle-outline" : "alert-circle-outline"
                  }
                  size={21}
                  color={isGood ? COLORS.success : COLORS.warning}
                />
                <View style={styles.reportItemCopy}>
                  <Text style={styles.reportIssue}>{issue}</Text>
                  {!isGood ? (
                    <Text style={styles.reportFix}>{getCorrection(issue)}</Text>
                  ) : null}
                </View>
              </View>
            ))}

            {angles.length ? (
              <>
                <Text style={styles.sectionTitle}>Measured angles</Text>
                <View style={styles.angleGrid}>
                  {angles.map(([key, value]) => (
                    <View key={key} style={styles.angleBox}>
                      <Text style={styles.angleValue}>{value}</Text>
                      <Text style={styles.angleLabel}>
                        {angleLabel[key] || key}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const RealTimeCamera = ({ navigation, route }) => {
  const { userId = "guest", exercise = "squat" } = route.params || {};
  const cameraRef = useRef(null);
  const captureIntervalRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [reportVisible, setReportVisible] = useState(false);
  const [source, setSource] = useState("Camera analysis");
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [liveState, setLiveState] = useState("starting");
  const [liveMessage, setLiveMessage] = useState(
    "Live posture feedback will start when the camera is ready.",
  );

  const status = useMemo(() => {
    if (!permission) {
      return "Checking camera permission";
    }

    if (!permission.granted) {
      return "Camera permission is needed for posture analysis";
    }

    if (!cameraReady) {
      return "Preparing camera";
    }

    if (liveEnabled) {
      return "Live correction is running. Use Analyze now for a full report.";
    }

    return "Live correction is paused. You can still analyze now.";
  }, [cameraReady, liveEnabled, permission]);

  const openReport = (data, nextSource) => {
    setAnalysis({
      score: data.score ?? 0,
      issues: data.issues ?? [],
      angles: data.angles ?? {},
    });
    setSource(nextSource);
    setReportVisible(true);
  };

  const applyLiveAnalysis = (data) => {
    const nextAnalysis = {
      score: data.score ?? 0,
      issues: data.issues ?? [],
      angles: data.angles ?? {},
    };

    setAnalysis(nextAnalysis);

    if (data.error) {
      setLiveMessage(data.error);
    } else if (nextAnalysis.issues.length) {
      setLiveMessage(getCorrection(nextAnalysis.issues[0]));
    } else {
      setLiveMessage("Form looks steady. Keep the full body inside the frame.");
    }
  };

  useEffect(() => {
    let mounted = true;

    const setupLive = async () => {
      if (!permission?.granted) {
        return;
      }

      try {
        await PostureService.getHealth();
      } catch (error) {
        if (mounted) {
          setLiveState("offline");
          setLiveMessage(
            "Posture service is offline. Start the Python service, then reopen this screen.",
          );
        }
        return;
      }

      WebSocketService.connect(
        userId,
        exercise,
        (data) => {
          if (mounted) {
            applyLiveAnalysis(data);
          }
        },
        (nextState) => {
          if (!mounted) {
            return;
          }

          setLiveState(nextState);
          if (nextState === "connected") {
            setLiveMessage("Live posture correction is connected.");
          } else if (nextState === "connecting") {
            setLiveMessage("Connecting to live posture correction...");
          } else if (nextState === "error" || nextState === "disconnected") {
            setLiveMessage(
              "Live correction disconnected. Check the posture service.",
            );
          }
        },
      );
    };

    setupLive();

    return () => {
      mounted = false;
      WebSocketService.disconnect();
    };
  }, [exercise, permission?.granted, userId]);

  useEffect(() => {
    clearInterval(captureIntervalRef.current);

    if (
      !permission?.granted ||
      !cameraReady ||
      !liveEnabled ||
      !WebSocketService.isConnected()
    ) {
      return undefined;
    }

    captureIntervalRef.current = setInterval(async () => {
      try {
        const photo = await cameraRef.current?.takePictureAsync({
          base64: true,
          quality: 0.35,
          skipProcessing: true,
        });

        if (photo?.base64) {
          WebSocketService.sendFrame(photo.base64);
        }
      } catch (error) {
        setLiveMessage(
          "Live frame capture paused. Hold steady and keep the camera open.",
        );
      }
    }, 1500);

    return () => {
      clearInterval(captureIntervalRef.current);
    };
  }, [cameraReady, liveEnabled, liveState, permission?.granted]);

  const analyzeCamera = async () => {
    if (!permission?.granted) {
      await requestPermission();
      return;
    }

    if (!cameraRef.current || !cameraReady) {
      Alert.alert(
        "Camera not ready",
        "Wait a moment for the camera preview to load.",
      );
      return;
    }

    try {
      setAnalyzing(true);
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.65,
        skipProcessing: true,
      });

      if (!photo?.base64) {
        throw new Error("Could not capture a camera frame.");
      }

      const data = await PostureService.analyzeImage({
        base64: photo.base64,
        userId,
        exercise,
      });
      openReport(data, "Camera analysis");
    } catch (error) {
      Alert.alert(
        "Analysis failed",
        error.message || "Could not analyze the camera frame.",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const uploadMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      base64: true,
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    const isVideo =
      asset.type === "video" ||
      asset.uri?.toLowerCase().match(/\.(mp4|mov|m4v)$/);

    try {
      setAnalyzing(true);
      if (!isVideo && !asset.base64) {
        throw new Error(
          "Could not read the selected image. Try another image or take a new photo.",
        );
      }

      const data = isVideo
        ? await PostureService.analyzeVideo({
            uri: asset.uri,
            userId,
            exercise,
          })
        : await PostureService.analyzeImage({
            base64: asset.base64,
            userId,
            exercise,
          });
      openReport(data, isVideo ? "Video upload" : "Image upload");
    } catch (error) {
      Alert.alert(
        "Upload analysis failed",
        error.message || "Could not analyze this file.",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.emptyText}>Checking camera permission...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => openAppDrawer(navigation)}
          activeOpacity={0.84}
          hitSlop={8}
        >
          <Icon name="menu" size={25} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.topCopy}>
          <Text style={styles.kicker}>Posture camera</Text>
          <Text style={styles.title}>Analyze form</Text>
        </View>
      </View>

      <View style={styles.cameraFrame}>
        {permission.granted ? (
          <>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
              active
              mute
              onCameraReady={() => setCameraReady(true)}
            />
            <View style={styles.livePanel}>
              <View style={styles.liveHeader}>
                <View
                  style={[
                    styles.liveDot,
                    {
                      backgroundColor:
                        liveState === "connected"
                          ? COLORS.success
                          : COLORS.warning,
                    },
                  ]}
                />
                <Text style={styles.liveLabel}>
                  {liveEnabled ? "Live correction" : "Live paused"}
                </Text>
                <TouchableOpacity
                  onPress={() => setLiveEnabled((value) => !value)}
                  style={styles.liveToggle}
                  activeOpacity={0.85}
                >
                  <Text style={styles.liveToggleText}>
                    {liveEnabled ? "Pause" : "Resume"}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.liveMessage} numberOfLines={2}>
                {liveMessage}
              </Text>
              {analysis ? (
                <View style={styles.liveScoreRow}>
                  <Text style={styles.liveScore}>{analysis.score ?? 0}</Text>
                  <Text style={styles.liveIssue} numberOfLines={1}>
                    {analysis.issues?.[0] || "No issue detected"}
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        ) : (
          <View style={styles.permissionPanel}>
            <Icon name="camera-off-outline" size={42} color={COLORS.primary} />
            <Text style={styles.permissionTitle}>
              Camera is not available yet
            </Text>
            <Text style={styles.permissionText}>
              Allow camera access so FitTrack can analyze your posture.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={requestPermission}
              activeOpacity={0.86}
            >
              <Text style={styles.primaryButtonText}>Allow camera</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.controlPanel}>
        <Text style={styles.statusText}>{status}</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={analyzeCamera}
          disabled={analyzing}
          activeOpacity={0.88}
        >
          {analyzing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Analyze now</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={uploadMedia}
          disabled={analyzing}
          activeOpacity={0.88}
        >
          <Icon name="tray-arrow-up" size={20} color="#FFFFFF" />
          <Text style={styles.secondaryButtonText}>Upload image or video</Text>
        </TouchableOpacity>
      </View>

      <ReportModal
        visible={reportVisible}
        analysis={analysis}
        source={source}
        onClose={() => setReportVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    padding: 24,
  },
  emptyText: {
    color: COLORS.text,
    marginTop: 14,
    fontWeight: "700",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
  },
  menuButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginRight: 14,
  },
  topCopy: {
    flex: 1,
  },
  kicker: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  title: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "900",
    marginTop: 2,
  },
  cameraFrame: {
    flex: 1,
    overflow: "hidden",
    marginHorizontal: 14,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  livePanel: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(11, 13, 16, 0.78)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: 12,
  },
  liveHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 8,
  },
  liveLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
    flex: 1,
  },
  liveToggle: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveToggleText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
  },
  liveMessage: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    lineHeight: 18,
  },
  liveScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  liveScore: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    marginRight: 10,
  },
  liveIssue: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  permissionPanel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  permissionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 14,
  },
  permissionText: {
    color: "rgba(255,255,255,0.66)",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 20,
  },
  controlPanel: {
    padding: 18,
    gap: 12,
  },
  statusText: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 14,
    textAlign: "center",
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.58)",
  },
  reportSheet: {
    maxHeight: "82%",
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  reportTitle: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "900",
    marginTop: 3,
  },
  iconButtonDark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceHigh,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
  },
  scoreCircle: {
    width: 78,
    height: 78,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  scoreCaption: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  scoreCopy: {
    flex: 1,
  },
  scoreTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },
  scoreText: {
    color: "rgba(255,255,255,0.68)",
    lineHeight: 20,
    marginTop: 5,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
    marginTop: 2,
  },
  reportItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  reportItemCopy: {
    flex: 1,
    marginLeft: 10,
  },
  reportIssue: {
    color: COLORS.text,
    fontWeight: "800",
    lineHeight: 20,
  },
  reportFix: {
    color: "rgba(255,255,255,0.64)",
    lineHeight: 20,
    marginTop: 4,
  },
  angleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 18,
  },
  angleBox: {
    minWidth: "30%",
    flexGrow: 1,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: 16,
    padding: 14,
  },
  angleValue: {
    color: COLORS.primary,
    fontSize: 19,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  angleLabel: {
    color: "rgba(255,255,255,0.62)",
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
  },
});

export default RealTimeCamera;
