
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { LightMode, TreeState } from '../types';
import { PARTICLE_COUNT, SNOW_COUNT, THEMES } from '../constants';

const Snow = () => {
  const points = useRef<THREE.Points>(null!);
  const posArr = useMemo(() => {
    const arr = new Float32Array(SNOW_COUNT * 3);
    for (let i = 0; i < SNOW_COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 50;
      arr[i * 3 + 1] = Math.random() * 40;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (!points.current) return;
    const attr = points.current.geometry.attributes.position;
    for (let i = 0; i < SNOW_COUNT; i++) {
      let y = attr.getY(i) - delta * 2.0;
      if (y < -10) y = 30;
      attr.setY(i, y);
      
      let x = attr.getX(i) + Math.sin(state.clock.elapsedTime * 0.4 + i) * 0.01;
      attr.setX(i, x);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={SNOW_COUNT} array={posArr} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.12} color="white" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
};

const ParticleTree = ({ treeState, lightMode }: { treeState: TreeState; lightMode: LightMode }) => {
  const points = useRef<THREE.Points>(null!);
  
  const shapes = useMemo(() => {
    const tree = new Float32Array(PARTICLE_COUNT * 3);
    const cloud = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ratio = i / PARTICLE_COUNT;
      const height = ratio * 14 - 7;
      const radius = (1 - ratio) * 5;
      const angle = ratio * Math.PI * 50;
      
      tree[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.6;
      tree[i * 3 + 1] = height;
      tree[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.6;

      const r = 10 + Math.random() * 15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      cloud[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      cloud[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 4;
      cloud[i * 3 + 2] = r * Math.cos(phi);

      if (Math.random() > 0.98) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.2; colors[i * 3 + 2] = 0.2;
      } else {
        const g = 0.4 + Math.random() * 0.5;
        colors[i * 3] = 0.05; colors[i * 3 + 1] = g; colors[i * 3 + 2] = 0.1;
      }
    }
    return { tree, cloud, colors };
  }, []);

  const currentPos = useMemo(() => new Float32Array(shapes.cloud), [shapes.cloud]);
  const tempColor = new THREE.Color();

  useFrame((state) => {
    if (!points.current) return;
    const attr = points.current.geometry.attributes.position;
    const target = treeState === TreeState.GROWING ? shapes.tree : shapes.cloud;
    const lerpFactor = treeState === TreeState.GROWING ? 0.07 : 0.025;

    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
      currentPos[i] = THREE.MathUtils.lerp(currentPos[i], target[i], lerpFactor);
      attr.array[i] = currentPos[i];
    }
    attr.needsUpdate = true;

    const theme = THEMES[lightMode];
    const pulse = 0.9 + Math.sin(state.clock.elapsedTime * 2.5) * 0.15;
    tempColor.set(theme.color).multiplyScalar(pulse);
    (points.current.material as THREE.PointsMaterial).color.lerp(tempColor, 0.08);
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={currentPos} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={PARTICLE_COUNT} array={shapes.colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.16} 
        vertexColors 
        blending={THREE.AdditiveBlending} 
        transparent 
        opacity={0.8} 
        sizeAttenuation
      />
    </points>
  );
};

export const ThreeScene: React.FC<{ lightMode: LightMode; treeState: TreeState }> = ({ lightMode, treeState }) => {
  const theme = THEMES[lightMode];

  return (
    <>
      <OrbitControls 
        enablePan={false} 
        autoRotate={treeState === TreeState.GROWING} 
        autoRotateSpeed={0.4} 
        maxDistance={40}
        minDistance={6}
      />
      
      <color attach="background" args={[theme.background]} />
      <fog attach="fog" args={[theme.background, 15, 60]} />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 8, 0]} intensity={2.5} color={theme.color} />
      <spotLight position={[10, 20, 10]} angle={0.2} penumbra={1} intensity={1.5} castShadow />
      
      <ParticleTree treeState={treeState} lightMode={lightMode} />
      <Snow />
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={theme.background} roughness={0.9} metalness={0.05} />
      </mesh>
    </>
  );
};
