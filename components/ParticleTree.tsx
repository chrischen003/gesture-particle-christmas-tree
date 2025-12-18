
import React, { useMemo, useRef } from 'react';
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
  
  // We'll store multiple positions to interpolate
  const shapes = useMemo(() => {
    const tree = new Float32Array(PARTICLE_COUNT * 3);
    const cloud = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT); // For flickering

    const layers = 12;
    const trunkParticles = Math.floor(PARTICLE_COUNT * 0.15);
    const starParticles = 200;
    const branchParticles = PARTICLE_COUNT - trunkParticles - starParticles;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let tx, ty, tz;
      let r, g, b;
      let size = 0.1 + Math.random() * 0.15;
      phases[i] = Math.random() * Math.PI * 2;

      if (i < trunkParticles) {
        // 1. Trunk (Dark Brown/Green)
        const h = Math.random() * 4 - 8;
        const rad = Math.random() * 0.6;
        const ang = Math.random() * Math.PI * 2;
        tx = Math.cos(ang) * rad;
        ty = h;
        tz = Math.sin(ang) * rad;
        r = 0.1; g = 0.2; b = 0.05;
        size *= 0.8;
      } else if (i < trunkParticles + starParticles) {
        // 2. Star at top (Bright Gold/White)
        const sSize = 0.8;
        tx = (Math.random() - 0.5) * sSize;
        ty = 7.5 + (Math.random() - 0.5) * sSize;
        tz = (Math.random() - 0.5) * sSize;
        r = 1.0; g = 1.0; b = 0.8;
        size *= 2.5;
      } else {
        // 3. Branches (Layered Foliage)
        const branchIdx = i - (trunkParticles + starParticles);
        const layerIdx = Math.floor((branchIdx / branchParticles) * layers);
        const layerProgress = (layerIdx / layers); // 0 (bottom) to 1 (top)
        
        const layerY = -5 + layerProgress * 12;
        const maxRadius = (1.1 - layerProgress) * 5.5;
        
        // Use spiral + noise for organic look
        const angle = Math.random() * Math.PI * 2;
        const spiralAngle = layerProgress * Math.PI * 10 + angle;
        const dist = Math.pow(Math.random(), 0.7) * maxRadius;
        
        tx = Math.cos(spiralAngle) * dist + (Math.random() - 0.5) * 0.4;
        ty = layerY + (Math.random() - 0.5) * 1.2;
        tz = Math.sin(spiralAngle) * dist + (Math.random() - 0.5) * 0.4;
        
        // Gradient green
        r = 0.0; g = 0.3 + (1 - layerProgress) * 0.4; b = 0.1;
        
        // Occasional lights
        if (Math.random() > 0.94) {
          r = 1.0; g = 0.9; b = 0.2;
          size *= 1.8;
        }
      }

      tree[i * 3] = tx;
      tree[i * 3 + 1] = ty;
      tree[i * 3 + 2] = tz;

      // Cloud shape (Spherical explosion)
      const distC = 8 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      cloud[i * 3] = distC * Math.sin(phi) * Math.cos(theta);
      cloud[i * 3 + 1] = distC * Math.sin(phi) * Math.sin(theta) + 2;
      cloud[i * 3 + 2] = distC * Math.cos(phi);

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
      sizes[i] = size;
    }

    return { tree, cloud, colors, sizes, phases };
  }, []);

  const currentPos = useMemo(() => new Float32Array(shapes.cloud), [shapes.cloud]);
  const colorObj = new THREE.Color();
  const secondaryColorObj = new THREE.Color();

  useFrame((state) => {
    if (!pointsRef.current) return;
    const attrPos = pointsRef.current.geometry.attributes.position;
    const target = treeState === TreeState.GROWING ? shapes.tree : shapes.cloud;
    const lerpFactor = treeState === TreeState.GROWING ? 0.06 : 0.02;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      // Spiral influence during growth
      let factor = lerpFactor;
      if (treeState === TreeState.GROWING) {
        // Add a slight "swirl" effect by adjusting factor based on distance
        const dx = attrPos.getX(i) - target[idx];
        const dy = attrPos.getY(i) - target[idx + 1];
        const dz = attrPos.getZ(i) - target[idx + 2];
        const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
        factor = Math.min(0.1, lerpFactor + (1 / (d + 1)) * 0.05);
      }

      attrPos.setX(i, THREE.MathUtils.lerp(attrPos.getX(i), target[idx], factor));
      attrPos.setY(i, THREE.MathUtils.lerp(attrPos.getY(i), target[idx + 1], factor));
      attrPos.setZ(i, THREE.MathUtils.lerp(attrPos.getZ(i), target[idx + 2], factor));
    }
    attrPos.needsUpdate = true;

    // Theming and Flickering
    const theme = THEMES[lightMode];
    colorObj.set(theme.color);
    secondaryColorObj.set(theme.secondaryColor);
    
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    // Mix theme colors based on time
    const t = (Math.sin(state.clock.elapsedTime * 0.5) + 1) / 2;
    mat.color.lerpColors(colorObj, secondaryColorObj, t);
    
    // Global pulse
    const pulse = 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    mat.opacity = 0.6 + pulse * 0.3;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={currentPos} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={PARTICLE_COUNT} array={shapes.colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.14} 
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
