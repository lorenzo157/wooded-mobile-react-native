import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAccelerometer, calculateTiltAngle } from './useAccelerometer';

interface TiltMeasureProps {
  onTiltChange: (angle: number) => void;
}

export default function TiltMeasure({ onTiltChange }: TiltMeasureProps) {
  const { data, isMeasuring, start, stop, canStart } = useAccelerometer('tilt');

  useEffect(() => {
    if (isMeasuring) {
      const angle = calculateTiltAngle(data.x, data.y, data.z);
      onTiltChange(Number(angle.toFixed(2)));
    }
  }, [data, isMeasuring]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, (!canStart() || isMeasuring) && styles.buttonDisabled]}
        onPress={start}
        disabled={!canStart() || isMeasuring}
      >
        <Text style={styles.buttonText}>
          {isMeasuring ? 'Calculando inclinacion...' : 'Medir inclinacion'}
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
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, marginBottom: 8 },
  button: { backgroundColor: '#388E3C', padding: 12, borderRadius: 8, alignItems: 'center' },
  stopButton: { backgroundColor: '#d32f2f', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
