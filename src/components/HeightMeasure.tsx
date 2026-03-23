import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  useAccelerometer,
  calculateHeight,
  calculateDistance,
} from "./useAccelerometer";
import { authService } from "../services/auth.service";

interface HeightMeasureProps {
  onHeightChange: (height: number) => void;
  children?: React.ReactNode;
}

export default function HeightMeasure({
  onHeightChange,
  children,
}: HeightMeasureProps) {
  const [distance, setDistance] = useState(10);
  const [userHeight, setUserHeight] = useState(1.7);
  const [mode, setMode] = useState<"idle" | "distance" | "height">("idle");
  const { data, isMeasuring, start, stop, canStart } =
    useAccelerometer("height");

  useEffect(() => {
    authService.getUser().then((user) => {
      if (user?.heightMeters) {
        setUserHeight(Number(user.heightMeters));
      }
    });
  }, []);

  useEffect(() => {
    if (!isMeasuring) return;

    if (mode === "distance") {
      const dist = calculateDistance(data.x, data.y, data.z, userHeight);
      setDistance(Number(dist.toFixed(2)));
    } else if (mode === "height") {
      const h = calculateHeight(data.x, data.y, data.z, distance, userHeight);
      onHeightChange(Number(h.toFixed(2)));
    }
  }, [data, isMeasuring, mode]);

  const startDistance = async () => {
    setMode("distance");
    await start();
  };

  const stopDistance = () => {
    stop();
    setMode("idle");
  };

  const startHeight = async () => {
    setMode("height");
    await start();
  };

  const stopHeight = () => {
    stop();
    setMode("idle");
  };

  const isDistancing = isMeasuring && mode === "distance";
  const isHeighting = isMeasuring && mode === "height";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>📏</Text>
        <Text style={styles.title}>Altura</Text>
      </View>
      <Text style={styles.hint}>
        Primero mida la distancia, luego la altura
      </Text>

      {/* Step 1: Distance */}
      <View style={styles.step}>
        <View style={styles.stepHeader}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>1</Text>
          </View>
          <Text style={styles.stepTitle}>Distancia</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.distanceButton,
              (!canStart || isMeasuring) && styles.buttonDisabled,
            ]}
            onPress={startDistance}
            disabled={!canStart || isMeasuring}
          >
            <Text style={styles.buttonText}>
              {isDistancing ? "Midiendo..." : "Medir"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.stopButton, !isDistancing && styles.buttonDisabled]}
            onPress={stopDistance}
            disabled={!isDistancing}
          >
            <Text style={styles.buttonText}>Detener</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.valueRow}>
          <Text style={styles.valueLabel}>Distancia (m):</Text>
          <TextInput
            style={styles.valueInput}
            keyboardType="numeric"
            value={String(distance)}
            onChangeText={(text) => setDistance(Number(text) || 0)}
          />
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Step 2: Height */}
      <View style={styles.step}>
        <View style={styles.stepHeader}>
          <View style={[styles.stepBadge, { backgroundColor: "#1976D2" }]}>
            <Text style={styles.stepBadgeText}>2</Text>
          </View>
          <Text style={styles.stepTitle}>Altura</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.heightButton,
              (!canStart || isMeasuring) && styles.buttonDisabled,
            ]}
            onPress={startHeight}
            disabled={!canStart || isMeasuring}
          >
            <Text style={styles.buttonText}>
              {isHeighting ? "Midiendo..." : "Medir"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.stopButton, !isHeighting && styles.buttonDisabled]}
            onPress={stopHeight}
            disabled={!isHeighting}
          >
            <Text style={styles.buttonText}>Detener</Text>
          </TouchableOpacity>
        </View>
      </View>
      {children && <View style={styles.childrenWrapper}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#1976D2",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  icon: { fontSize: 18, marginRight: 8 },
  title: { fontSize: 15, fontWeight: "bold", color: "#333" },
  hint: { fontSize: 12, color: "#888", marginBottom: 12 },
  step: { marginBottom: 4 },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#7B1FA2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  stepBadgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  stepTitle: { fontSize: 14, fontWeight: "600", color: "#555" },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  distanceButton: {
    flex: 1,
    backgroundColor: "#7B1FA2",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  heightButton: {
    flex: 1,
    backgroundColor: "#1976D2",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  stopButton: {
    flex: 1,
    backgroundColor: "#d32f2f",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  valueLabel: { color: "#555", fontSize: 13, marginRight: 8 },
  valueInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 4,
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 10,
  },
  childrenWrapper: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
});
