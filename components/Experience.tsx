
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import ParticleTree from './ParticleTree';
import { TreeState, LightMode } from '../types';
import { SNOW_COUNT } from '../constants';

interface ExperienceProps {
  treeState: TreeState;
  lightMode: LightMode;
}

const Snow: React.FC = () => {
  const points = useRef<THREE.Points>(null!);
  const positions = React.useMemo(() => {
    const arr = new Float32Array(SNOW_COUNT * 3);
    for (let i = 0; i < SNOW_COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 1] = Math.random() * 40;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    const attr = points.current.geometry.attributes.position;
    for (let i = 0; i < SNOW_COUNT; i++) {
      let y = attr.getY(i);
      y -= delta * 2;
      if (y < -5) y = 30;
      attr.setY(i, y);
      
      // Add slight sway
      let x = attr.getX(i);
      x += Math.sin(state.clock.elapsedTime + i) * 0.01;
      attr.setX(i, x);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.1} 
        color="#ffffff" 
        transparent 
        opacity={0.6} 
        sizeAttenuation 
      />
    </points>
  );
};

const Experience: React.FC<ExperienceProps> = ({ treeState, lightMode }) => {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      <ParticleTree treeState={treeState} lightMode={lightMode} />
      <Snow />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#050505" roughness={1} metalness={0} />
      </mesh>
    </>
  );
};

export default Experience;
