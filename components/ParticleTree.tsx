
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState, LightMode } from '../types';
import { PARTICLE_COUNT, THEMES } from '../constants';

interface ParticleTreeProps {
  treeState: TreeState;
  lightMode: LightMode;
}

const easeInOutCubic = (x: number): number => {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

const ParticleTree: React.FC<ParticleTreeProps> = ({ treeState, lightMode }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const transitionProgress = useRef(treeState === TreeState.GROWING ? 1 : 0);
  
  const shapes = useMemo(() => {
    const tree = new Float32Array(PARTICLE_COUNT * 3);
    const cloud = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    const layers = 12;
    const trunkParticles = Math.floor(PARTICLE_COUNT * 0.12);
    const starParticles = 300;
    const branchParticles = PARTICLE_COUNT - trunkParticles - starParticles;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let tx, ty, tz;
      let r, g, b;
      let size = 0.07 + Math.random() * 0.1;

      if (i < trunkParticles) {
        // Trunk - Subtle dark tones
        const h = Math.random() * 5 - 8.5;
        const rad = Math.random() * 0.75;
        const ang = Math.random() * Math.PI * 2;
        tx = Math.cos(ang) * rad;
        ty = h;
        tz = Math.sin(ang) * rad;
        r = 0.05; g = 0.1; b = 0.02;
        size *= 0.6;
      } else if (i < trunkParticles + starParticles) {
        // Star - High intensity for Bloom
        const sSize = 1.0;
        tx = (Math.random() - 0.5) * sSize;
        ty = 8.2 + (Math.random() - 0.5) * sSize;
        tz = (Math.random() - 0.5) * sSize;
        // Over-bright white/yellow to trigger bloom
        r = 2.5; g = 2.2; b = 1.2; 
        size *= 3.5;
      } else {
        // Branches
        const branchIdx = i - (trunkParticles + starParticles);
        const layerIdx = Math.floor((branchIdx / branchParticles) * layers);
        const layerProgress = (layerIdx / layers);
        
        const layerY = -6.5 + layerProgress * 14.5;
        const maxRadius = (1.1 - layerProgress) * 6.5;
        const angle = Math.random() * Math.PI * 2;
        const spiralAngle = layerProgress * Math.PI * 14 + angle;
        const dist = Math.pow(Math.random(), 0.7) * maxRadius;
        
        tx = Math.cos(spiralAngle) * dist + (Math.random() - 0.5) * 0.6;
        ty = layerY + (Math.random() - 0.5) * 1.6;
        tz = Math.sin(spiralAngle) * dist + (Math.random() - 0.5) * 0.6;
        
        // Base dark green
        r = 0.01; g = 0.15 + (1 - layerProgress) * 0.3; b = 0.05;
        
        // Glowy decorative lights
        if (Math.random() > 0.96) {
          r = 1.8; g = 1.5; b = 0.5; // Over-bright lights
          size *= 2.5;
        }
      }

      tree[i * 3] = tx;
      tree[i * 3 + 1] = ty;
      tree[i * 3 + 2] = tz;

      const distC = 12 + Math.random() * 28;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      cloud[i * 3] = distC * Math.sin(phi) * Math.cos(theta);
      cloud[i * 3 + 1] = distC * Math.sin(phi) * Math.sin(theta) + 3;
      cloud[i * 3 + 2] = distC * Math.cos(phi);

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
      sizes[i] = size;
    }

    return { tree, cloud, colors, sizes };
  }, []);

  const currentPos = useMemo(() => new Float32Array(shapes.cloud), [shapes.cloud]);
  const colorObj = new THREE.Color();
  const secColorObj = new THREE.Color();

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const attrPos = pointsRef.current.geometry.attributes.position;
    
    const targetProgress = treeState === TreeState.GROWING ? 1 : 0;
    transitionProgress.current = THREE.MathUtils.lerp(
      transitionProgress.current, 
      targetProgress, 
      delta * 1.8
    );

    const easedFactor = easeInOutCubic(transitionProgress.current);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      attrPos.setX(i, THREE.MathUtils.lerp(shapes.cloud[idx], shapes.tree[idx], easedFactor));
      attrPos.setY(i, THREE.MathUtils.lerp(shapes.cloud[idx+1], shapes.tree[idx+1], easedFactor));
      attrPos.setZ(i, THREE.MathUtils.lerp(shapes.cloud[idx+2], shapes.tree[idx+2], easedFactor));
    }
    attrPos.needsUpdate = true;

    const theme = THEMES[lightMode];
    colorObj.set(theme.color);
    secColorObj.set(theme.secondaryColor);
    
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    const flicker = Math.sin(state.clock.elapsedTime * 4) * 0.1 + 0.9;
    const themeTransition = (Math.sin(state.clock.elapsedTime * 0.6) + 1) / 2;
    
    mat.color.lerpColors(colorObj, secColorObj, themeTransition).multiplyScalar(flicker);
    mat.opacity = (0.5 + 0.3 * easedFactor) * (0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.2);
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={currentPos} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={PARTICLE_COUNT} array={shapes.colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.15} 
        vertexColors 
        transparent 
        opacity={0.8} 
        sizeAttenuation 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default ParticleTree;
