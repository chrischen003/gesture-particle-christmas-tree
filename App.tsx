
import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { ThreeScene } from './components/ThreeScene';
import { UiPanel } from './components/UiPanel';
import { startHandTracking, stopHandTracking } from './gesture/handTracker';
import { detectGesture, GestureType } from './gesture/gestureEngine';
import { TreeState, LightMode, Language } from './types';
import { getDefaultLanguage } from './i18n';
import { THEMES } from './constants';
import './styles.css';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(getDefaultLanguage());
  const [gesture, setGesture] = useState<GestureType>(GestureType.NONE);
  const [lightMode, setLightMode] = useState<LightMode>(LightMode.WARM);
  const [treeState, setTreeState] = useState<TreeState>(TreeState.GROWING);
  const [cameraStatus, setCameraStatus] = useState<'loading' | 'ready' | 'denied'>('loading');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastGestureRef = useRef<GestureType>(GestureType.NONE);

  const onResults = useCallback((results: any) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const detected = detectGesture(results.multiHandLandmarks[0]);
      if (detected !== lastGestureRef.current) {
        lastGestureRef.current = detected;
        setGesture(detected);

        if (detected === GestureType.OPEN_HAND) {
          setTreeState(TreeState.GROWING);
        } else if (detected === GestureType.FIST) {
          setTreeState(TreeState.EXPLODED);
        } else if (detected === GestureType.OK_SIGN) {
          setLightMode(prev => {
            if (prev === LightMode.WARM) return LightMode.ICE;
            if (prev === LightMode.ICE) return LightMode.NEON;
            return LightMode.WARM;
          });
        }
      }
    } else if (lastGestureRef.current !== GestureType.NONE) {
      lastGestureRef.current = GestureType.NONE;
      setGesture(GestureType.NONE);
    }
  }, []);

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
        <Suspense fallback={<div className="flex items-center justify-center w-full h-full text-white text-lg">Initializing Magic...</div>}>
          <Canvas 
            shadows 
            dpr={[1, 2]} 
            camera={{ position: [0, 4, 18], fov: 45 }}
            style={{ width: '100%', height: '100%' }}
          >
            <ThreeScene lightMode={lightMode} treeState={treeState} />
            <EffectComposer>
              <Bloom 
                luminanceThreshold={0.4} 
                mipmapBlur 
                intensity={theme.bloomIntensity * 1.0} 
                radius={0.3}
              />
            </EffectComposer>
          </Canvas>
        </Suspense>

        {/* Video Feedback Area */}
        <div className="absolute bottom-4 right-4 z-20">
          <div className="relative w-32 h-24 rounded-xl border border-white/20 overflow-hidden shadow-2xl bg-black/40 backdrop-blur">
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
        
        {/* Gesture Visualizer */}
        {gesture !== GestureType.NONE && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 select-none">
              <div className="text-[12rem] opacity-20 animate-pulse transition-all filter blur-[1px]">
                {gesture === GestureType.OK_SIGN ? '👌' : gesture === GestureType.OPEN_HAND ? '✋' : '✊'}
              </div>
           </div>
        )}
      </div>

      <UiPanel 
        lang={lang}
        onLangChange={() => setLang(l => l === 'zh' ? 'en' : 'zh')}
        gesture={gesture}
        lightMode={lightMode}
        cameraStatus={cameraStatus}
        treeState={treeState}
        onManualAction={handleManualAction}
      />
    </div>
  );
};

export default App;
