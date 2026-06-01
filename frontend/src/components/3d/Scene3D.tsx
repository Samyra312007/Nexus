'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function StarField() {
  const ref = useRef<THREE.Points>(null);
  
  const points = useMemo(() => {
    const p = new Float32Array(5000 * 3);
    for (let i = 0; i < 5000; i++) {
      p[i * 3] = (Math.random() - 0.5) * 50;
      p[i * 3 + 1] = (Math.random() - 0.5) * 50;
      p[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return p;
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.05;
      ref.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={points} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#8B5CF6"
          size={0.05}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

function Grid() {
  return (
    <gridHelper 
      args={[100, 50, '#1E293B', '#0F172A']} 
      position={[0, -10, 0]} 
      rotation={[0, 0, 0]}
    />
  );
}

export function Scene3D() {
  return (
    <div className="scene-container">
      <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
        <color attach="background" args={['#030407']} />
        <fog attach="fog" args={['#030407', 10, 50]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#7C3AED" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06B6D4" />
        <StarField />
        <Grid />
      </Canvas>
      <div className="bg-vignette" />
    </div>
  );
}
