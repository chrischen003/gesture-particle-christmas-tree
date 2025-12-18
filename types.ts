
export enum TreeState {
  GROWING = 'GROWING',
  EXPLODED = 'EXPLODED'
}

export enum LightMode {
  WARM = 'WARM',
  ICE = 'ICE',
  NEON = 'NEON'
}

export type Language = 'zh' | 'en';

export interface I18nContent {
  title: string;
  subtitle: string;
  growHint: string;
  explodeHint: string;
  modeHint: string;
  cameraRequest: string;
  cameraDenied: string;
  currentMode: string;
  modeNames: Record<LightMode, string>;
  gestureStatus: string;
  gestureNames: Record<string, string>;
}
