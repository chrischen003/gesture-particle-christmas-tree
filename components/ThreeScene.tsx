
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { LightMode, TreeState } from '../types';
import { SNOW_COUNT, THEMES } from '../constants';
import ParticleTree from './ParticleTree';

const Snow = () => {
  const points = useRef<THREE.Points>(null!);
  const posArr = useMemo(() => {
    const arr = new Float32Array(SNOW_COUNT * 3);
    for (let i = 0; i < SNOW_COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 65;
      arr[i * 3 + 1] = Math.random() * 50 - 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 65;
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (!points.current) return;
    const attr = points.current.geometry.attributes.position;
    for (let i = 0; i < SNOW_COUNT; i++) {
      let y = attr.getY(i) - delta * 2.5;
      if (y < -18) y = 38;
      attr.setY(i, y);
      
      let x = attr.getX(i) + Math.sin(state.clock.elapsedTime * 0.4 + i) * 0.025;
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
        size={0.12} 
        color="#ffffff" 
        transparent 
        opacity={0.3} 
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
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.3;
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 3, 24]} fov={38} />
      <OrbitControls 
        enablePan={false} 
        autoRotate={treeState === TreeState.GROWING} 
        autoRotateSpeed={0.4} 
        maxDistance={50}
        minDistance={10}
        maxPolarAngle={Math.PI / 1.7}
        minPolarAngle={Math.PI / 5}
      />
      
      <color attach="background" args={[theme.background]} />
      <fog attach="fog" args={[theme.background, 25, 75]} />
      
      <Stars radius={130} depth={70} count={7000} factor={6} saturation={0.8} fade speed={2} />
      
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 12, 0]} intensity={4} color={theme.color} />
      <pointLight position={[5, -5, 10]} intensity={2} color={theme.secondaryColor} />
      
      <group ref={groupRef}>
        <ParticleTree treeState={treeState} lightMode={lightMode} />
        <Snow />
      </group>
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial 
          color={theme.background} 
          roughness={0.7} 
          metalness={0.3} 
          emissive={theme.background}
          emissiveIntensity={0.15}
        />
      </mesh>

      <EffectComposer disableNormalPass multisampling={4}>
        <Bloom 
          luminanceThreshold={theme.bloomThreshold} 
          mipmapBlur 
          intensity={theme.bloomIntensity} 
          radius={0.6}
        />
        <Noise opacity={0.015} />
        <Vignette eskil={false} offset={0.15} darkness={1.1} />
      </EffectComposer>
    </>
  );
};
