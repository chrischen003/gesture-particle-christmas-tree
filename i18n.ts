
import { Language, LightMode } from './types';

const messages = {
  zh: {
    title: '手势粒子圣诞树',
    subtitle: '用你的双手，让圣诞树长出来。',
    growHint: '张开手掌：让圣诞树长出来',
    explodeHint: '握拳：让圣诞树炸裂成星尘',
    modeHint: 'OK 手势：切换灯光模式',
    cameraRequest: '正在请求摄像头权限...',
    cameraDenied: '未获得摄像头权限，可使用按钮体验交互',
    currentMode: '当前模式',
    modeNames: {
      [LightMode.WARM]: '暖黄壁炉',
      [LightMode.ICE]: '冰蓝雪夜',
      [LightMode.NEON]: '糖果霓虹',
    },
    gestureStatus: '当前手势',
    gestureNames: {
      OPEN_HAND: '张开手掌',
      FIST: '握拳',
      OK_SIGN: 'OK 手势',
      NONE: '无'
    }
  },
  en: {
    title: 'Particle Xmas Tree',
    subtitle: 'Grow a magical tree with your hands.',
    growHint: 'Open hand: Grow the tree',
    explodeHint: 'Fist: Explode into stardust',
    modeHint: 'OK gesture: Switch light mode',
    cameraRequest: 'Requesting camera permission...',
    cameraDenied: 'Camera access denied. Use buttons instead.',
    currentMode: 'Mode',
    modeNames: {
      [LightMode.WARM]: 'Warm Fireplace',
      [LightMode.ICE]: 'Ice Blue Night',
      [LightMode.NEON]: 'Candy Neon',
    },
    gestureStatus: 'Gesture',
    gestureNames: {
      OPEN_HAND: 'Open Hand',
      FIST: 'Fist',
      OK_SIGN: 'OK Gesture',
      NONE: 'None'
    }
  }
};

export const getTranslation = (lang: Language) => {
  const t = messages[lang];
  return (key: string) => {
    const keys = key.split('.');
    let result: any = t;
    for (const k of keys) {
      result = result[k];
    }
    return result || key;
  };
};

export const getDefaultLanguage = (): Language => {
  return navigator.language.startsWith('zh') ? 'zh' : 'en';
};
