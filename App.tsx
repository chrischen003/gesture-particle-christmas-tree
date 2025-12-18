
import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { ThreeScene } from './components/ThreeScene';
import { UiPanel } from './components/UiPanel';
import { startHandTracking, stopHandTracking } from './gesture/handTracker';
import { detectGesture, GestureType, GestureResult } from './gesture/gestureEngine';
import { TreeState, LightMode, Language } from './types';
import { getDefaultLanguage } from './i18n';
import { THEMES } from './constants';
import './styles.css';

const DEBOUNCE_TIME = 400; // ms to stabilize a gesture

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(getDefaultLanguage());
  const [gesture, setGesture] = useState<GestureType>(GestureType.NONE);
  const [confidence, setConfidence] = useState<number>(0);
  const [lightMode, setLightMode] = useState<LightMode>(LightMode.WARM);
  const [treeState, setTreeState] = useState<TreeState>(TreeState.GROWING);
  const [cameraStatus, setCameraStatus] = useState<'loading' | 'ready' | 'denied'>('loading');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Debouncing refs
  const currentTargetRef = useRef<GestureType>(GestureType.NONE);
  const startTimeRef = useRef<number>(0);
  const activeGestureRef = useRef<GestureType>(GestureType.NONE);

  const onResults = useCallback((results: any) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const result: GestureResult = detectGesture(results.multiHandLandmarks[0]);
      setConfidence(result.confidence);

      const now = Date.now();
      
      // If detected gesture matches our current target, check if we've held it long enough
      if (result.type === currentTargetRef.current && result.type !== GestureType.NONE) {
        if (now - startTimeRef.current > DEBOUNCE_TIME) {
          // Stabilization complete! Trigger logic if it's a new gesture
          if (result.type !== activeGestureRef.current) {
            activeGestureRef.current = result.type;
            setGesture(result.type);
            triggerAction(result.type);
          }
        }
      } else {
        // Target changed, reset timer
        currentTargetRef.current = result.type;
        startTimeRef.current = now;
        
        // If it's NONE, we can immediately reflect that in visual state, 
        // but wait for stabilization for action triggers
        if (result.type === GestureType.NONE) {
          activeGestureRef.current = GestureType.NONE;
          setGesture(GestureType.NONE);
        }
      }
    } else {
      setConfidence(0);
      setGesture(GestureType.NONE);
      activeGestureRef.current = GestureType.NONE;
      currentTargetRef.current = GestureType.NONE;
    }
  }, []);

  const triggerAction = (type: GestureType) => {
    if (type === GestureType.OPEN_HAND) {
      setTreeState(TreeState.GROWING);
    } else if (type === GestureType.FIST) {
      setTreeState(TreeState.EXPLODED);
    } else if (type === GestureType.OK_SIGN) {
      setLightMode(prev => {
        if (prev === LightMode.WARM) return LightMode.ICE;
        if (prev === LightMode.ICE) return LightMode.NEON;
        return LightMode.WARM;
      });
    }
  };

  useEffect(() => {
    let active = true;
    if (videoRef.current) {
      startHandTracking(
        videoRef.current,
        (res) => active && onResults(res),
        () => active && setCameraStatus('denied')
      ).then(success => {
        if (active) {
          setCameraStatus(success ? 'ready' : 'denied');
        }
      }).catch(() => {
        if (active) setCameraStatus('denied');
      });
    }
    return () => {
      active = false;
      stopHandTracking();
    };
  }, [onResults]);

  const handleManualAction = (action: string) => {
    if (action === 'GROW') setTreeState(TreeState.GROWING);
    if (action === 'EXPLODE') setTreeState(TreeState.EXPLODED);
    if (action === 'MODE') {
      setLightMode(prev => {
        if (prev === LightMode.WARM) return LightMode.ICE;
        if (prev === LightMode.ICE) return LightMode.NEON;
        return LightMode.WARM;
      });
    }
  };

  const theme = THEMES[lightMode];

  return (
    <div className="app-container">
      <div className="scene-container">
        <Suspense fallback={<div className="flex items-center justify-center w-full h-full text-white text-lg bg-black">Initializing Magic...</div>}>
          <Canvas 
            shadows 
            dpr={[1, 2]} 
            camera={{ position: [0, 2, 22], fov: 40 }}
            style={{ width: '100%', height: '100%' }}
          >
            <ThreeScene lightMode={lightMode} treeState={treeState} />
            <EffectComposer disableNormalPass>
              <Bloom 
                luminanceThreshold={0.15} 
                mipmapBlur 
                intensity={theme.bloomIntensity} 
                radius={0.5}
              />
              <Noise opacity={0.02} />
              <Vignette eskil={false} offset={0.1} darkness={1.05} />
            </EffectComposer>
          </Canvas>
        </Suspense>

        {/* Video Feedback Area */}
        <div className="absolute bottom-4 right-4 z-20">
          <div className="relative w-36 h-28 rounded-2xl border border-white/20 overflow-hidden shadow-2xl bg-black/40 backdrop-blur ring-1 ring-white/10">
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover scale-x-[-1]" 
              autoPlay playsInline muted 
            />
            {cameraStatus === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] bg-black/60 text-white animate-pulse">
                AI INIT...
              </div>
            )}
            {cameraStatus === 'denied' && (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] bg-red-900/40 text-white text-center p-1">
                CAM DENIED
              </div>
            )}
          </div>
        </div>
        
        {/* Gesture Visualizer Overlay */}
        {gesture !== GestureType.NONE && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 select-none">
              <div className="text-[14rem] opacity-20 animate-pulse transition-all filter blur-[1px]">
                {gesture === GestureType.OK_SIGN ? '👌' : gesture === GestureType.OPEN_HAND ? '✋' : '✊'}
              </div>
           </div>
        )}
      </div>

      <UiPanel 
        lang={lang}
        onLangChange={() => setLang(l => l === 'zh' ? 'en' : 'zh')}
        gesture={gesture}
        confidence={confidence}
        lightMode={lightMode}
        cameraStatus={cameraStatus}
        treeState={treeState}
        onManualAction={handleManualAction}
      />
    </div>
  );
};

export default App;
