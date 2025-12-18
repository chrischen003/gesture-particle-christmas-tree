
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState, LightMode } from '../types';
import { PARTICLE_COUNT, THEMES } from '../constants';

interface ParticleTreeProps {
  treeState: TreeState;
  lightMode: LightMode;
}

// Cubic Easing function for smoother transitions
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
    const starParticles = 250;
    const branchParticles = PARTICLE_COUNT - trunkParticles - starParticles;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let tx, ty, tz;
      let r, g, b;
      let size = 0.08 + Math.random() * 0.12;

      if (i < trunkParticles) {
        // Trunk
        const h = Math.random() * 5 - 8.5;
        const rad = Math.random() * 0.7;
        const ang = Math.random() * Math.PI * 2;
        tx = Math.cos(ang) * rad;
        ty = h;
        tz = Math.sin(ang) * rad;
        r = 0.08; g = 0.15; b = 0.04;
        size *= 0.7;
      } else if (i < trunkParticles + starParticles) {
        // Star
        const sSize = 0.9;
        tx = (Math.random() - 0.5) * sSize;
        ty = 8 + (Math.random() - 0.5) * sSize;
        tz = (Math.random() - 0.5) * sSize;
        r = 1.0; g = 1.0; b = 0.9;
        size *= 2.8;
      } else {
        // Branches
        const branchIdx = i - (trunkParticles + starParticles);
        const layerIdx = Math.floor((branchIdx / branchParticles) * layers);
        const layerProgress = (layerIdx / layers);
        
        const layerY = -6 + layerProgress * 13.5;
        const maxRadius = (1.15 - layerProgress) * 6;
        const angle = Math.random() * Math.PI * 2;
        const spiralAngle = layerProgress * Math.PI * 12 + angle;
        const dist = Math.pow(Math.random(), 0.65) * maxRadius;
        
        tx = Math.cos(spiralAngle) * dist + (Math.random() - 0.5) * 0.5;
        ty = layerY + (Math.random() - 0.5) * 1.5;
        tz = Math.sin(spiralAngle) * dist + (Math.random() - 0.5) * 0.5;
        
        r = 0.0; g = 0.25 + (1 - layerProgress) * 0.45; b = 0.08;
        
        if (Math.random() > 0.95) {
          r = 1.0; g = 0.95; b = 0.4; // Decorative lights
          size *= 2.2;
        }
      }

      tree[i * 3] = tx;
      tree[i * 3 + 1] = ty;
      tree[i * 3 + 2] = tz;

      // Cloud - random explosion sphere
      const distC = 10 + Math.random() * 25;
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
    
    // Manage transition progress
    const targetProgress = treeState === TreeState.GROWING ? 1 : 0;
    transitionProgress.current = THREE.MathUtils.lerp(
      transitionProgress.current, 
      targetProgress, 
      delta * 2 // Speed of transition
    );

    // Use eased factor for the actual position interpolation
    const easedFactor = easeInOutCubic(transitionProgress.current);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      attrPos.setX(i, THREE.MathUtils.lerp(shapes.cloud[idx], shapes.tree[idx], easedFactor));
      attrPos.setY(i, THREE.MathUtils.lerp(shapes.cloud[idx+1], shapes.tree[idx+1], easedFactor));
      attrPos.setZ(i, THREE.MathUtils.lerp(shapes.cloud[idx+2], shapes.tree[idx+2], easedFactor));
    }
    attrPos.needsUpdate = true;

    // Theming & Pulse
    const theme = THEMES[lightMode];
    colorObj.set(theme.color);
    secColorObj.set(theme.secondaryColor);
    
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    const t = (Math.sin(state.clock.elapsedTime * 0.8) + 1) / 2;
    mat.color.lerpColors(colorObj, secColorObj, t);
    
    const pulse = 0.85 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
    mat.opacity = (0.4 + 0.3 * easedFactor) * pulse;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={currentPos} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={PARTICLE_COUNT} array={shapes.colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.16} 
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
