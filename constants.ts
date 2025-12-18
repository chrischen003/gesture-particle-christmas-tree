
import { LightMode } from './types';

export const PARTICLE_COUNT = 20000;
export const SNOW_COUNT = 1200;

export const THEMES: Record<LightMode, { color: string; background: string; bloomIntensity: number; secondaryColor: string }> = {
  [LightMode.WARM]: {
    color: '#ffaa33', // Golden
    secondaryColor: '#ff4400', // Orange-red
    background: '#0d0800',
    bloomIntensity: 2.5,
  },
  [LightMode.ICE]: {
    color: '#ffffff', // White
    secondaryColor: '#00ccff', // Cyan-blue
    background: '#00050d',
    bloomIntensity: 1.8,
  },
  [LightMode.NEON]: {
    color: '#00ffff', // Cyan
    secondaryColor: '#ff00ff', // Magenta
    background: '#050005',
    bloomIntensity: 3.5,
  }
};
