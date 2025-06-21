import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh } from 'three';

const BodyScanner3D: React.FC = () => {
  const groupRef = useRef<Group>(null);
  const scanLineRef = useRef<Mesh>(null);
  const [scanProgress, setScanProgress] = useState(0);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
    
    if (scanLineRef.current) {
      const progress = (Math.sin(state.clock.elapsedTime * 2) + 1) / 2;
      scanLineRef.current.position.y = -2 + progress * 4;
      setScanProgress(progress);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Human body outline */}
      <group>
        {/* Head */}
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial 
            color="#60a5fa" 
            transparent 
            opacity={0.3}
            wireframe
          />
        </mesh>
        
        {/* Torso */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.6, 0.4, 2, 8]} />
          <meshStandardMaterial 
            color="#60a5fa" 
            transparent 
            opacity={0.3}
            wireframe
          />
        </mesh>
        
        {/* Arms */}
        <mesh position={[-0.8, 0.8, 0]} rotation={[0, 0, Math.PI / 6]}>
          <cylinderGeometry args={[0.15, 0.15, 1.5, 8]} />
          <meshStandardMaterial 
            color="#60a5fa" 
            transparent 
            opacity={0.3}
            wireframe
          />
        </mesh>
        
        <mesh position={[0.8, 0.8, 0]} rotation={[0, 0, -Math.PI / 6]}>
          <cylinderGeometry args={[0.15, 0.15, 1.5, 8]} />
          <meshStandardMaterial 
            color="#60a5fa" 
            transparent 
            opacity={0.3}
            wireframe
          />
        </mesh>
        
        {/* Legs */}
        <mesh position={[-0.3, -1.5, 0]}>
          <cylinderGeometry args={[0.2, 0.15, 2, 8]} />
          <meshStandardMaterial 
            color="#60a5fa" 
            transparent 
            opacity={0.3}
            wireframe
          />
        </mesh>
        
        <mesh position={[0.3, -1.5, 0]}>
          <cylinderGeometry args={[0.2, 0.15, 2, 8]} />
          <meshStandardMaterial 
            color="#60a5fa" 
            transparent 
            opacity={0.3}
            wireframe
          />
        </mesh>
      </group>
      
      {/* Scanning line */}
      <mesh ref={scanLineRef} position={[0, -2, 0]}>
        <planeGeometry args={[3, 0.1]} />
        <meshStandardMaterial 
          color="#10b981" 
          emissive="#10b981"
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Scan data points */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh 
          key={i} 
          position={[
            (Math.random() - 0.5) * 2,
            -2 + Math.random() * 4,
            (Math.random() - 0.5) * 0.5
          ]}
        >
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial 
            color="#10b981" 
            emissive="#10b981"
            emissiveIntensity={Math.random() * 0.5}
          />
        </mesh>
      ))}
    </group>
  );
};

export default BodyScanner3D;