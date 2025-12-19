
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

// Colors for the aesthetic gradient
const COLOR_BOTTOM = new THREE.Color("#FFD700"); // Gold
const COLOR_MID = new THREE.Color("#4682B4");    // SteelBlue
const COLOR_TOP = new THREE.Color("#B0E0E6");    // IceBlue

const ParticleTree: React.FC<ParticleTreeProps> = ({ treeState, lightMode }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const transitionProgress = useRef(treeState === TreeState.GROWING ? 1 : 0);
  
  const shapes = useMemo(() => {
    const tree = new Float32Array(PARTICLE_COUNT * 3);
    const cloud = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    const trunkParticles = Math.floor(PARTICLE_COUNT * 0.1);
    const starParticles = 600;
    const branchParticles = PARTICLE_COUNT - trunkParticles - starParticles;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let tx, ty, tz;
      let r, g, b;

      if (i < trunkParticles) {
        // Trunk
        const h = Math.random() * 4 - 8;
        const rad = Math.random() * 0.4;
        const ang = Math.random() * Math.PI * 2;
        tx = Math.cos(ang) * rad;
        ty = h;
        tz = Math.sin(ang) * rad;
      } else if (i < trunkParticles + starParticles) {
        // Tree-top Star
        const sSize = 1.2;
        tx = (Math.random() - 0.5) * sSize;
        ty = 8.5 + (Math.random() - 0.5) * sSize;
        tz = (Math.random() - 0.5) * sSize;
      } else {
        // Branches - Conical distribution
        const branchIdx = i - (trunkParticles + starParticles);
        const t = branchIdx / branchParticles;
        const layerY = -7 + t * 15;
        const maxRadius = (1.0 - t) * 7.5;
        const angle = Math.random() * Math.PI * 2;
        const spiral = t * Math.PI * 12;
        const dist = Math.pow(Math.random(), 0.7) * maxRadius;
        
        tx = Math.cos(angle + spiral) * dist + (Math.random() - 0.5) * 0.3;
        ty = layerY + (Math.random() - 0.5) * 1.5;
        tz = Math.sin(angle + spiral) * dist + (Math.random() - 0.5) * 0.3;
      }

      // Assign colors based on Y position (Gradient)
      const normalizedY = (ty + 8) / 17; // range 0 to 1
      const tempColor = new THREE.Color();
      if (normalizedY < 0.5) {
        tempColor.lerpColors(COLOR_BOTTOM, COLOR_MID, normalizedY * 2);
      } else {
        tempColor.lerpColors(COLOR_MID, COLOR_TOP, (normalizedY - 0.5) * 2);
      }
      
      // Add randomness to color for "shimmer" effect
      const noise = (Math.random() - 0.5) * 0.1;
      colors[i * 3] = tempColor.r + noise;
      colors[i * 3 + 1] = tempColor.g + noise;
      colors[i * 3 + 2] = tempColor.b + noise;

      // Particle sizes: 0.5 to 2.5 range (depth of field look)
      sizes[i] = 0.5 + Math.random() * 2.0;

      tree[i * 3] = tx;
      tree[i * 3 + 1] = ty;
      tree[i * 3 + 2] = tz;

      // Cloud state (Shatter)
      const distC = 18 + Math.random() * 22;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      cloud[i * 3] = distC * Math.sin(phi) * Math.cos(theta);
      cloud[i * 3 + 1] = distC * Math.sin(phi) * Math.sin(theta) + 2;
      cloud[i * 3 + 2] = distC * Math.cos(phi);
    }

    return { tree, cloud, colors, sizes };
  }, []);

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
      attrPos.array[idx] = THREE.MathUtils.lerp(shapes.cloud[idx], shapes.tree[idx], easedFactor);
      attrPos.array[idx+1] = THREE.MathUtils.lerp(shapes.cloud[idx+1], shapes.tree[idx+1], easedFactor);
      attrPos.array[idx+2] = THREE.MathUtils.lerp(shapes.cloud[idx+2], shapes.tree[idx+2], easedFactor);
    }
    attrPos.needsUpdate = true;

    // Theme based color modification (overlay)
    const theme = THEMES[lightMode];
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    const pulse = 0.9 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
    mat.opacity = (0.7 + 0.3 * easedFactor) * pulse;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={shapes.tree} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={PARTICLE_COUNT} array={shapes.colors} itemSize={3} />
        {/* We use a standard pointsMaterial for simplicity, though a shader would be better for sizes */}
      </bufferGeometry>
      <pointsMaterial 
        size={0.15} 
        vertexColors 
        transparent 
        sizeAttenuation 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default ParticleTree;
