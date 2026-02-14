import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import { Accelerometer } from 'expo-sensors';

interface AccelerometerData {
  x: number;
  y: number;
  z: number;
}

// Singleton coordinator with subscriber notifications
let activeComponent: string | null = null;
const listeners = new Set<() => void>();

function getActiveComponent() {
  return activeComponent;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function setActiveComponent(id: string | null) {
  activeComponent = id;
  listeners.forEach((cb) => cb());
}

export function useAccelerometer(componentId: string) {
  const [data, setData] = useState<AccelerometerData>({ x: 0, y: 0, z: 0 });
  const [isMeasuring, setIsMeasuring] = useState(false);
  const subscriptionRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);

  // Re-render when activeComponent changes in any component
  const currentActive = useSyncExternalStore(subscribe, getActiveComponent);

  const canStart = useCallback(() => {
    return !currentActive || currentActive === componentId;
  }, [currentActive, componentId]);

  const start = useCallback(async () => {
    if (isMeasuring || !canStart()) return false;

    setActiveComponent(componentId);
    Accelerometer.setUpdateInterval(100);
    subscriptionRef.current = Accelerometer.addListener((accelData) => {
      setData(accelData);
    });
    setIsMeasuring(true);
    return true;
  }, [componentId, isMeasuring, canStart]);

  const stop = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    if (activeComponent === componentId) {
      setActiveComponent(null);
    }
    setIsMeasuring(false);
  }, [componentId]);

  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      if (activeComponent === componentId) {
        setActiveComponent(null);
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
  faceHeight: number = 0.3
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
  faceHeight: number = 0.3
): number {
  const heightPear = userHeight - faceHeight;
  const magnitude = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
  if (magnitude === 0) return 10;

  const tiltAngleRadians = Math.acos(Math.abs(y) / magnitude);
  if (tiltAngleRadians < 0.1) return 10;

  return Math.tan(tiltAngleRadians) * heightPear;
}
