
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { LightMode, TreeState } from '../types';
import { SNOW_COUNT, THEMES } from '../constants';
import ParticleTree from './ParticleTree';

const Snow = () => {
  const points = useRef<THREE.Points>(null!);
  const posArr = useMemo(() => {
    const arr = new Float32Array(SNOW_COUNT * 3);
    for (let i = 0; i < SNOW_COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 60;
      arr[i * 3 + 1] = Math.random() * 50 - 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (!points.current) return;
    const attr = points.current.geometry.attributes.position;
    for (let i = 0; i < SNOW_COUNT; i++) {
      let y = attr.getY(i) - delta * 3.0;
      if (y < -15) y = 35;
      attr.setY(i, y);
      
      let x = attr.getX(i) + Math.sin(state.clock.elapsedTime * 0.3 + i) * 0.02;
      attr.setX(i, x);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={SNOW_COUNT} array={posArr} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.15} 
        color="#ffffff" 
        transparent 
        opacity={0.4} 
        sizeAttenuation 
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export const ThreeScene: React.FC<{ lightMode: LightMode; treeState: TreeState }> = ({ lightMode, treeState }) => {
  const theme = THEMES[lightMode];
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    // Gentle floating movement for the whole scene
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 22]} fov={40} />
      <OrbitControls 
        enablePan={false} 
        autoRotate={treeState === TreeState.GROWING} 
        autoRotateSpeed={0.5} 
        maxDistance={45}
        minDistance={8}
        maxPolarAngle={Math.PI / 1.8}
        minPolarAngle={Math.PI / 4}
      />
      
      <color attach="background" args={[theme.background]} />
      <fog attach="fog" args={[theme.background, 20, 70]} />
      
      <Stars radius={120} depth={60} count={6000} factor={5} saturation={0.5} fade speed={1.5} />
      
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 10, 0]} intensity={3} color={theme.color} />
      <pointLight position={[0, -5, 5]} intensity={1.5} color={theme.secondaryColor} />
      <spotLight 
        position={[15, 25, 15]} 
        angle={0.3} 
        penumbra={1} 
        intensity={2} 
        color={theme.color}
        castShadow 
      />
      
      <group ref={groupRef}>
        <ParticleTree treeState={treeState} lightMode={lightMode} />
        <Snow />
      </group>
      
      {/* Ground with subtle reflection feel */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -9, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial 
          color={theme.background} 
          roughness={0.8} 
          metalness={0.2} 
          emissive={theme.background}
          emissiveIntensity={0.1}
        />
      </mesh>
    </>
  );
};
