'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, MeshWobbleMaterial, Icosahedron } from '@react-three/drei';
import * as THREE from 'three';

function NexusCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.z += delta * 0.3;
    }
    if (outerRef.current) {
      outerRef.current.rotation.y -= delta * 0.2;
    }
  });

  return (
    <group ref={outerRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <Icosahedron ref={meshRef} args={[1, 15]} scale={2.5}>
          <MeshDistortMaterial
            color="#7C3AED"
            speed={3}
            distort={0.4}
            radius={1}
            emissive="#4C1D95"
            emissiveIntensity={0.5}
          />
        </Icosahedron>
      </Float>
      
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4, 0.02, 16, 100]} />
        <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={2} />
      </mesh>
      
      <mesh rotation={[0, Math.PI / 4, 0]}>
        <torusGeometry args={[4.5, 0.01, 16, 100]} />
        <meshStandardMaterial color="#A78BFA" emissive="#A78BFA" emissiveIntensity={1} />
      </mesh>

      <Sphere args={[0.05, 16, 16]} position={[4, 0, 0]}>
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={5} />
      </Sphere>
    </group>
  );
}

export function HeroScene() {
  return (
    <div className="w-full h-[500px] mb-8 relative">
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#7C3AED" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#06B6D4" />
        <NexusCore />
      </Canvas>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-[#030407]" />
    </div>
  );
}
