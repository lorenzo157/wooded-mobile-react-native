import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useAccelerometer, calculateHeight, calculateDistance } from './useAccelerometer';
import { authService } from '../services/auth.service';

interface HeightMeasureProps {
  onHeightChange: (height: number) => void;
}

export default function HeightMeasure({ onHeightChange }: HeightMeasureProps) {
  const [distance, setDistance] = useState(10);
  const [userHeight, setUserHeight] = useState(1.7);
  const [mode, setMode] = useState<'idle' | 'distance' | 'height'>('idle');
  const { data, isMeasuring, start, stop, canStart } = useAccelerometer('height');

  useEffect(() => {
    authService.getUser().then((user) => {
      if (user?.heightMeters) {
        setUserHeight(Number(user.heightMeters));
      }
    });
  }, []);

  useEffect(() => {
    if (!isMeasuring) return;

    if (mode === 'distance') {
      const dist = calculateDistance(data.x, data.y, data.z, userHeight);
      setDistance(Number(dist.toFixed(2)));
    } else if (mode === 'height') {
      const h = calculateHeight(data.x, data.y, data.z, distance, userHeight);
      onHeightChange(Number(h.toFixed(2)));
    }
  }, [data, isMeasuring, mode]);

  const startDistance = async () => {
    setMode('distance');
    await start();
  };

  const stopDistance = () => {
    stop();
    setMode('idle');
  };

  const startHeight = async () => {
    setMode('height');
    await start();
  };

  const stopHeight = () => {
    stop();
    setMode('idle');
  };

  const isDistancing = isMeasuring && mode === 'distance';
  const isHeighting = isMeasuring && mode === 'height';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.distanceButton, (!canStart() || isMeasuring) && styles.buttonDisabled]}
        onPress={startDistance}
        disabled={!canStart() || isMeasuring}
      >
        <Text style={styles.buttonText}>
          {isDistancing ? 'Calculando distancia...' : 'Medir distancia'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.stopButton, !isDistancing && styles.buttonDisabled]}
        onPress={stopDistance}
        disabled={!isDistancing}
      >
        <Text style={styles.buttonText}>Detener</Text>
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Distancia entre usted y el arbol (metros)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(distance)}
          onChangeText={(text) => setDistance(Number(text) || 0)}
        />
      </View>

      <TouchableOpacity
        style={[styles.heightButton, (!canStart() || isMeasuring) && styles.buttonDisabled]}
        onPress={startHeight}
        disabled={!canStart() || isMeasuring}
      >
        <Text style={styles.buttonText}>
          {isHeighting ? 'Calculando altura...' : 'Medir altura'}
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
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, marginBottom: 8 },
  distanceButton: { backgroundColor: '#7B1FA2', padding: 12, borderRadius: 8, alignItems: 'center' },
  heightButton: { backgroundColor: '#1976D2', padding: 12, borderRadius: 8, alignItems: 'center' },
  stopButton: { backgroundColor: '#d32f2f', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  inputContainer: { marginVertical: 4 },
  inputLabel: { color: '#555', fontSize: 13, marginBottom: 4 },
  input: { borderBottomWidth: 1, borderBottomColor: '#ddd', paddingVertical: 8, fontSize: 16 },
});
