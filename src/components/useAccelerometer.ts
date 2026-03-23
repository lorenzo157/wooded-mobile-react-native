import { useState, useEffect, useRef } from "react";
import { Accelerometer } from "expo-sensors";
import { Alert } from "react-native";

interface AccelerometerData {
  x: number;
  y: number;
  z: number;
}

// Simple shared state: which component is currently measuring
let activeComponent: string | null = null;

export function useAccelerometer(componentId: string) {
  const [data, setData] = useState<AccelerometerData>({ x: 0, y: 0, z: 0 });
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const subscriptionRef = useRef<ReturnType<
    typeof Accelerometer.addListener
  > | null>(null);

  // Poll activeComponent to update disabled state
  // This is simpler and more reliable than useSyncExternalStore in RN
  useEffect(() => {
    const interval = setInterval(() => {
      const isBlocked =
        activeComponent !== null && activeComponent !== componentId;
      setBlocked(isBlocked);
    }, 300);
    return () => clearInterval(interval);
  }, [componentId]);

  const canStart = !blocked && !isMeasuring;

  const start = async () => {
    const available = await Accelerometer.isAvailableAsync();
    if (!available) {
      Alert.alert(
        "Error",
        "El acelerometro no esta disponible en este dispositivo.",
      );
      return false;
    }
    if (activeComponent && activeComponent !== componentId) return false;
    if (isMeasuring) return false;

    activeComponent = componentId;
    setBlocked(false);
    Accelerometer.setUpdateInterval(100);
    subscriptionRef.current = Accelerometer.addListener((accelData) => {
      setData(accelData);
    });
    setIsMeasuring(true);
    return true;
  };

  const stop = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    if (activeComponent === componentId) {
      activeComponent = null;
    }
    setIsMeasuring(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      if (activeComponent === componentId) {
        activeComponent = null;
      }
    };
  }, [componentId]);

  return { data, isMeasuring, start, stop, canStart };
}

export function calculateTiltAngle(x: number, y: number, z: number): number {
  const magnitude = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
  if (magnitude === 0) return 0;
  const tiltAngleRadians = Math.acos(y / magnitude);
  return (tiltAngleRadians * 180) / Math.PI;
}

export function calculateHeight(
  x: number,
  y: number,
  z: number,
  distance: number,
  userHeight: number,
  faceHeight: number = 0.3,
): number {
  const heightPear = userHeight - faceHeight;
  const magnitude = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
  if (magnitude === 0) return heightPear;

  const tiltAngleRadians = Math.acos(Math.abs(y) / magnitude);
  if (tiltAngleRadians < 0.1) return heightPear;

  return distance / Math.tan(tiltAngleRadians) + heightPear;
}

export function calculateDistance(
  x: number,
  y: number,
  z: number,
  userHeight: number,
  faceHeight: number = 0.3,
): number {
  const heightPear = userHeight - faceHeight;
  const magnitude = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
  if (magnitude === 0) return 10;

  const tiltAngleRadians = Math.acos(Math.abs(y) / magnitude);
  if (tiltAngleRadians < 0.1) return 10;

  return Math.tan(tiltAngleRadians) * heightPear;
}
