
import React, { useEffect, useRef, useState } from 'react';

// Using scripts from CDN via document injection for simplicity in this sandbox
const HANDS_JS = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
const CAMERA_JS = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';

interface HandTrackerProps {
  onGesture: (gesture: string) => void;
  onCameraReady: () => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onGesture, onCameraReady }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastGestureRef = useRef<string>('None');
  const [initStatus, setInitStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let camera: any = null;
    let hands: any = null;

    const loadScripts = async () => {
      const loadScript = (src: string) => new Promise((res) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = res;
        document.head.appendChild(s);
      });

      await loadScript(HANDS_JS);
      await loadScript(CAMERA_JS);
      initMediapipe();
    };

    const initMediapipe = () => {
      // @ts-ignore
      hands = new window.Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
      });

      hands.onResults(onResults);

      if (videoRef.current) {
        // @ts-ignore
        camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            await hands.send({ image: videoRef.current! });
          },
          width: 640,
          height: 480
        });
        camera.start().then(() => {
          setInitStatus('ready');
          onCameraReady();
        }).catch(() => setInitStatus('error'));
      }
    };

    const onResults = (results: any) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const gesture = detectGesture(landmarks);
        if (gesture !== lastGestureRef.current) {
          lastGestureRef.current = gesture;
          onGesture(gesture);
        }
      } else {
        if (lastGestureRef.current !== 'None') {
          lastGestureRef.current = 'None';
          onGesture('None');
        }
      }
    };

    const detectGesture = (lm: any[]): string => {
      // Finger tips and MCPs
      const tips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky
      const mcps = [5, 9, 13, 17];
      
      const thumbTip = lm[4];
      const indexTip = lm[8];

      // 1. OK Gesture: Thumb tip and Index tip distance
      const okDist = Math.sqrt(
        Math.pow(thumbTip.x - indexTip.x, 2) + 
        Math.pow(thumbTip.y - indexTip.y, 2)
      );
      if (okDist < 0.05) return 'OK';

      // 2. Count extended fingers
      let extendedFingers = 0;
      for (let i = 0; i < tips.length; i++) {
        // In MediaPipe, y decreases upwards. If tip is significantly above MCP, it's extended.
        if (lm[tips[i]].y < lm[mcps[i]].y - 0.05) {
          extendedFingers++;
        }
      }

      // Simple mapping
      if (extendedFingers >= 3) return 'Open';
      if (extendedFingers === 0) return 'Fist';
      
      return 'None';
    };

    loadScripts();

    return () => {
      if (camera) camera.stop();
      if (hands) hands.close();
    };
  }, [onGesture, onCameraReady]);

  return (
    <div className="fixed bottom-4 right-4 w-40 h-30 overflow-hidden rounded-lg border-2 border-white/20 opacity-40 hover:opacity-100 transition-opacity z-50 bg-black">
      <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay playsInline muted />
      {initStatus === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white">Loading AI...</div>
      )}
      {initStatus === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-red-400">Cam Error</div>
      )}
    </div>
  );
};

export default HandTracker;
