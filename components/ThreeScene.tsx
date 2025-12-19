
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, MeshReflectorMaterial, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import { LightMode, TreeState } from '../types';
import { SNOW_COUNT, THEMES } from '../constants';
import ParticleTree from './ParticleTree';

// Spiral Light Trails wrapping around the tree
const LightTrails = () => {
  const groupRef = useRef<THREE.Group>(null!);
  
  const trails = useMemo(() => {
    return [0, 1, 2, 3].map((i) => {
      const points = [];
      const segments = 100;
      const radiusBase = 6 - i * 1.2;
      const heightBase = 15;
      const rotations = 3 + i;
      
      for (let j = 0; j <= segments; j++) {
        const t = j / segments;
        const angle = t * Math.PI * 2 * rotations + (i * Math.PI / 2);
        const radius = (1 - t) * radiusBase;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = -7 + t * heightBase;
        points.push(new THREE.Vector3(x, y, z));
      }
      return new THREE.CatmullRomCurve3(points);
    });
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {trails.map((curve, idx) => (
        <mesh key={idx}>
          <tubeGeometry args={[curve, 100, 0.04, 8, false]} />
          <meshStandardMaterial 
            color={idx % 2 === 0 ? "#FFD700" : "#00CED1"} 
            emissive={idx % 2 === 0 ? "#FFA500" : "#B0E0E6"}
            emissiveIntensity={4}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
};

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
      let y = attr.getY(i) - delta * 2.5;
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
        size={0.08} 
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

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 25]} fov={35} />
      <OrbitControls 
        enablePan={false} 
        autoRotate={treeState === TreeState.GROWING} 
        autoRotateSpeed={0.3} 
        maxDistance={45}
        minDistance={12}
        maxPolarAngle={Math.PI / 1.7}
      />
      
      <color attach="background" args={["#020205"]} />
      <fog attach="fog" args={["#020205", 25, 75]} />
      
      <Stars radius={150} depth={50} count={7000} factor={4} saturation={0} fade speed={1} />
      
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 10, 0]} intensity={5} color={theme.color} />
      <spotLight position={[15, 20, 15]} angle={0.3} penumbra={1} intensity={2} castShadow />
      
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <ParticleTree treeState={treeState} lightMode={lightMode} />
        {treeState === TreeState.GROWING && <LightTrails />}
      </Float>

      <Snow />
      
      {/* High-end Ground Reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -9, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={40}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050505"
          metalness={0.5}
          mirror={1}
        />
      </mesh>

      <EffectComposer disableNormalPass multisampling={4}>
        <Bloom 
          luminanceThreshold={0.2} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.8}
        />
        <ChromaticAberration offset={new THREE.Vector2(0.001, 0.001)} />
        <Noise opacity={0.03} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};
