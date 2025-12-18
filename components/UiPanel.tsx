
import React from 'react';
import { GestureType } from '../gesture/gestureEngine';
import { LightMode, Language, TreeState } from '../types';
import { getTranslation } from '../i18n';

interface UiPanelProps {
  lang: Language;
  onLangChange: () => void;
  gesture: GestureType;
  lightMode: LightMode;
  cameraStatus: 'loading' | 'ready' | 'denied';
  treeState: TreeState;
  onManualAction: (action: string) => void;
}

export const UiPanel: React.FC<UiPanelProps> = ({
  lang,
  onLangChange,
  gesture,
  lightMode,
  cameraStatus,
  treeState,
  onManualAction
}) => {
  const t = getTranslation(lang);

  return (
    <div className="ui-container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <button onClick={onLangChange} className="btn-primary text-xs">
          {lang === 'zh' ? 'EN' : '中文'}
        </button>
      </div>

      <p className="text-white/60 text-sm mb-6">{t('subtitle')}</p>

      <div className="glass-panel">
        <h3 className="text-xs uppercase tracking-widest text-white/40 mb-3">Controls</h3>
        <ul className="text-sm space-y-2">
          <li className={`${gesture === GestureType.OPEN_HAND ? 'text-green-400' : 'text-white/80'}`}>{t('growHint')}</li>
          <li className={`${gesture === GestureType.FIST ? 'text-green-400' : 'text-white/80'}`}>{t('explodeHint')}</li>
          <li className={`${gesture === GestureType.OK_SIGN ? 'text-green-400' : 'text-white/80'}`}>{t('modeHint')}</li>
        </ul>
      </div>

      <div className="glass-panel">
        <h3 className="text-xs uppercase tracking-widest text-white/40 mb-3">Status</h3>
        <div className="flex justify-between text-sm mb-2">
          <span>{t('currentMode')}:</span>
          <span className="text-orange-400">{t(`modeNames.${lightMode}`)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>{t('gestureStatus')}:</span>
          <span className="text-blue-400 font-bold">{t(`gestureNames.${gesture}`)}</span>
        </div>
      </div>

      <div className="mt-auto">
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-2 h-2 rounded-full ${cameraStatus === 'ready' ? 'bg-green-500' : cameraStatus === 'loading' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-white/50">
            {cameraStatus === 'loading' ? t('cameraRequest') : cameraStatus === 'denied' ? t('cameraDenied') : 'Camera Active'}
          </span>
        </div>

        {/* Manual Fallback Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => onManualAction('GROW')} className="btn-primary text-[10px] py-1">GROW</button>
          <button onClick={() => onManualAction('EXPLODE')} className="btn-primary text-[10px] py-1">EXPLODE</button>
          <button onClick={() => onManualAction('MODE')} className="btn-primary text-[10px] py-1">MODE</button>
        </div>
      </div>
    </div>
  );
};
