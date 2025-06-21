import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

const Brain3D: React.FC<{ scale?: number; color?: string }> = ({ 
  scale = 1, 
  color = '#8b5cf6' 
}) => {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={meshRef} scale={scale}>
      {/* Main brain structure */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.2} 
          roughness={0.8}
          emissive={color}
          emissiveIntensity={0.05}
        />
      </mesh>
      
      {/* Brain hemispheres detail */}
      <mesh position={[-0.3, 0.2, 0.2]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.3} 
          roughness={0.7}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      <mesh position={[0.3, 0.2, 0.2]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.3} 
          roughness={0.7}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Neural pathways effect */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[
          Math.sin(i * 0.8) * 0.8,
          Math.cos(i * 0.8) * 0.3,
          Math.sin(i * 1.2) * 0.5
        ]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial 
            color="#60a5fa" 
            emissive="#60a5fa"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
};

export default Brain3D;