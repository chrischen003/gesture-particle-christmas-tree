
import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState, LightMode } from '../types';
import { PARTICLE_COUNT, THEMES } from '../constants';

interface ParticleTreeProps {
  treeState: TreeState;
  lightMode: LightMode;
}

const ParticleTree: React.FC<ParticleTreeProps> = ({ treeState, lightMode }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const currentPos = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  const treePos = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  const cloudPos = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  const colors = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);

  // Initialize shapes
  useMemo(() => {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Tree shape (Conical spiral + randomness)
      const ratio = i / PARTICLE_COUNT;
      const height = ratio * 12;
      const radius = (1 - ratio) * 4;
      const angle = ratio * Math.PI * 40; // Spirals
      
      const tx = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      const ty = height - 2;
      const tz = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;

      treePos[i * 3] = tx;
      treePos[i * 3 + 1] = ty;
      treePos[i * 3 + 2] = tz;

      // Cloud/Explosion shape (Sphere-ish)
      const dist = 5 + Math.random() * 15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      cloudPos[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
      cloudPos[i * 3 + 1] = dist * Math.sin(phi) * Math.sin(theta) + 5;
      cloudPos[i * 3 + 2] = dist * Math.cos(phi);

      // Initial state
      currentPos[i * 3] = cloudPos[i * 3];
      currentPos[i * 3 + 1] = cloudPos[i * 3 + 1];
      currentPos[i * 3 + 2] = cloudPos[i * 3 + 2];

      // Base colors (mix of green and festive colors)
      const isOrnament = Math.random() > 0.95;
      if (isOrnament) {
          colors[i * 3] = 1.0;
          colors[i * 3 + 1] = 0.2;
          colors[i * 3 + 2] = 0.2;
      } else {
          colors[i * 3] = 0.1;
          colors[i * 3 + 1] = 0.5 + Math.random() * 0.5;
          colors[i * 3 + 2] = 0.1;
      }
    }
  }, [treePos, cloudPos, currentPos, colors]);

  const targetColor = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    const positions = pointsRef.current.geometry.attributes.position;
    const lerpSpeed = treeState === TreeState.GROWING ? 0.05 : 0.02;
    const targetSet = treeState === TreeState.GROWING ? treePos : cloudPos;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      // Smooth interpolation for each axis
      positions.setX(i, THREE.MathUtils.lerp(positions.getX(i), targetSet[idx], lerpSpeed));
      positions.setY(i, THREE.MathUtils.lerp(positions.getY(i), targetSet[idx + 1], lerpSpeed));
      positions.setZ(i, THREE.MathUtils.lerp(positions.getZ(i), targetSet[idx + 2], lerpSpeed));
    }
    positions.needsUpdate = true;

    // Update material properties based on theme
    const theme = THEMES[lightMode];
    targetColor.set(theme.color);
    (pointsRef.current.material as THREE.PointsMaterial).color.lerp(targetColor, 0.05);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={currentPos.length / 3}
          array={currentPos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.15} 
        vertexColors 
        transparent 
        opacity={0.8} 
        sizeAttenuation 
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default ParticleTree;
