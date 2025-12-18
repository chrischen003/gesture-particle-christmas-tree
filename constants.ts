
import { LightMode } from './types';

export const PARTICLE_COUNT = 20000;
export const SNOW_COUNT = 1200;

export interface ThemeConfig {
  color: string;
  secondaryColor: string;
  background: string;
  bloomIntensity: number;
  bloomThreshold: number;
  glowColor: string;
}

export const THEMES: Record<LightMode, ThemeConfig> = {
  [LightMode.WARM]: {
    color: '#ff9900', // Deep Gold
    secondaryColor: '#ff4400', // Fire Orange
    background: '#0a0600',
    bloomIntensity: 2.2,
    bloomThreshold: 0.1,
    glowColor: '#ffcc00',
  },
  [LightMode.ICE]: {
    color: '#ffffff', // Pure White
    secondaryColor: '#00ccff', // Electric Cyan
    background: '#000810',
    bloomIntensity: 1.5,
    bloomThreshold: 0.2,
    glowColor: '#88eeff',
  },
  [LightMode.NEON]: {
    color: '#00ffcc', // Mint Neon
    secondaryColor: '#ff00ff', // Hot Pink
    background: '#080008',
    bloomIntensity: 3.0,
    bloomThreshold: 0.05,
    glowColor: '#00ffff',
  }
};
