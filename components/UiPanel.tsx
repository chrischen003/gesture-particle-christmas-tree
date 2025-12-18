
import React, { useEffect, useState } from 'react';
import { GestureType } from '../gesture/gestureEngine';
import { LightMode, Language, TreeState } from '../types';
import { getTranslation } from '../i18n';

interface UiPanelProps {
  lang: Language;
  onLangChange: () => void;
  gesture: GestureType;
  confidence: number;
  lightMode: LightMode;
  cameraStatus: 'loading' | 'ready' | 'denied';
  treeState: TreeState;
  onManualAction: (action: string) => void;
}

export const UiPanel: React.FC<UiPanelProps> = ({
  lang,
  onLangChange,
  gesture,
  confidence,
  lightMode,
  cameraStatus,
  treeState,
  onManualAction
}) => {
  const t = getTranslation(lang);
  const [flash, setFlash] = useState(false);

  // Trigger a visual flash when a gesture is recognized with high confidence
  useEffect(() => {
    if (gesture !== GestureType.NONE && confidence > 0.85) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 300);
      return () => clearTimeout(timer);
    }
  }, [gesture, confidence]);

  const getGestureStyles = (type: GestureType) => {
    if (gesture !== type) return 'text-white/40 opacity-50 grayscale';
    
    const isHighConf = confidence > 0.85;
    return `transition-all duration-300 transform scale-105 ${
      isHighConf ? 'text-green-400 font-bold drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'text-yellow-300'
    }`;
  };

  return (
    <div className={`ui-container transition-colors duration-300 ${flash ? 'ring-2 ring-inset ring-white/30 bg-white/10' : ''}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">{t('title')}</h1>
        <button onClick={onLangChange} className="px-3 py-1 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 transition-colors text-xs font-mono">
          {lang === 'zh' ? 'EN' : '中文'}
        </button>
      </div>

      <p className="text-white/50 text-xs leading-relaxed mb-6">{t('subtitle')}</p>

      <div className="glass-panel group">
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4 group-hover:text-white/50 transition-colors">Gesture Commands</h3>
        <ul className="text-sm space-y-4">
          <li className={`flex items-center gap-3 transition-all ${getGestureStyles(GestureType.OPEN_HAND)}`}>
            <span className="text-2xl">✋</span> {t('growHint')}
          </li>
          <li className={`flex items-center gap-3 transition-all ${getGestureStyles(GestureType.FIST)}`}>
            <span className="text-2xl">✊</span> {t('explodeHint')}
          </li>
          <li className={`flex items-center gap-3 transition-all ${getGestureStyles(GestureType.OK_SIGN)}`}>
            <span className="text-2xl">👌</span> {t('modeHint')}
          </li>
        </ul>
      </div>

      <div className="glass-panel">
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4">Recognition Status</h3>
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">{t('gestureStatus')}</span>
            <span className={`transition-all font-mono uppercase tracking-widest ${gesture !== GestureType.NONE ? 'text-blue-400 scale-110' : 'text-white/20'}`}>
              {t(`gestureNames.${gesture}`)}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-white/40">
              <span>Confidence</span>
              <span className={confidence > 0.8 ? 'text-green-400' : ''}>{(confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ease-out ${confidence > 0.8 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-blue-500'}`}
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel mt-2">
        <div className="flex justify-between text-sm items-center">
          <span className="text-white/50">{t('currentMode')}</span>
          <span className="text-orange-300/80 px-2 py-0.5 rounded border border-orange-300/20 bg-orange-300/5 text-xs font-bold tracking-wide">
            {t(`modeNames.${lightMode}`)}
          </span>
        </div>
      </div>

      <div className="mt-auto space-y-4 pt-4">
        <div className="flex items-center gap-3 px-1">
          <div className={`w-2 h-2 rounded-full ${cameraStatus === 'ready' ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]' : cameraStatus === 'loading' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]'}`} />
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
            {cameraStatus === 'loading' ? t('cameraRequest') : cameraStatus === 'denied' ? t('cameraDenied') : 'Optical Link Active'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => onManualAction('GROW')} className="btn-primary py-3 text-[10px] font-bold uppercase tracking-widest hover:border-white/40 transition-all">Grow</button>
          <button onClick={() => onManualAction('EXPLODE')} className="btn-primary py-3 text-[10px] font-bold uppercase tracking-widest hover:border-white/40 transition-all">Shatter</button>
          <button onClick={() => onManualAction('MODE')} className="btn-primary py-3 text-[10px] font-bold uppercase tracking-widest hover:border-white/40 transition-all">Theme</button>
        </div>
      </div>
    </div>
  );
};
