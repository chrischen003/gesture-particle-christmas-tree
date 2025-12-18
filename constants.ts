
import { LightMode } from './types';

export const PARTICLE_COUNT = 8000;
export const SNOW_COUNT = 800;

export const THEMES: Record<LightMode, { color: string; background: string; bloomIntensity: number }> = {
  [LightMode.WARM]: {
    color: '#ffaa33',
    background: '#1a0f00',
    bloomIntensity: 1.5,
  },
  [LightMode.ICE]: {
    color: '#88ccff',
    background: '#000a1a',
    bloomIntensity: 1.2,
  },
  [LightMode.NEON]: {
    color: '#ff00ff',
    background: '#0a000a',
    bloomIntensity: 2.2,
  }
};
