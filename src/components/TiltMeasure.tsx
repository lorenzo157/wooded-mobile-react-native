import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAccelerometer, calculateTiltAngle } from "./useAccelerometer";

interface TiltMeasureProps {
  onTiltChange: (angle: number) => void;
  children?: React.ReactNode;
}

export default function TiltMeasure({
  onTiltChange,
  children,
}: TiltMeasureProps) {
  const { data, isMeasuring, start, stop, canStart } = useAccelerometer("tilt");

  useEffect(() => {
    if (isMeasuring) {
      const angle = calculateTiltAngle(data.x, data.y, data.z);
      onTiltChange(Number(angle.toFixed(2)));
    }
  }, [data, isMeasuring]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>📐</Text>
        <Text style={styles.title}>Inclinacion</Text>
      </View>
      <Text style={styles.hint}>
        Apoye el celular contra el tronco del arbol
      </Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.startButton,
            (!canStart || isMeasuring) && styles.buttonDisabled,
          ]}
          onPress={start}
          disabled={!canStart || isMeasuring}
        >
          <Text style={styles.buttonText}>
            {isMeasuring ? "Midiendo..." : "Medir"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.stopButton, !isMeasuring && styles.buttonDisabled]}
          onPress={stop}
          disabled={!isMeasuring}
        >
          <Text style={styles.buttonText}>Detener</Text>
        </TouchableOpacity>
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
    borderLeftColor: "#795548",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  icon: { fontSize: 18, marginRight: 8 },
  title: { fontSize: 15, fontWeight: "bold", color: "#333" },
  hint: { fontSize: 12, color: "#888", marginBottom: 10 },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  startButton: {
    flex: 1,
    backgroundColor: "#795548",
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
  childrenWrapper: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
});
