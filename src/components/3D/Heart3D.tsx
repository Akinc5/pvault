import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Shape, ExtrudeGeometry } from 'three';
import * as THREE from 'three';

const Heart3D: React.FC<{ scale?: number; color?: string }> = ({ 
  scale = 1, 
  color = '#ff6b6b' 
}) => {
  const meshRef = useRef<Mesh>(null);

  // Create heart shape using mathematical formula
  const heartGeometry = useMemo(() => {
    const shape = new Shape();
    const x = 0, y = 0;
    
    shape.moveTo(x + 5, y + 5);
    shape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
    shape.bezierCurveTo(x - 6, y, x - 6, y + 3.5, x - 6, y + 3.5);
    shape.bezierCurveTo(x - 6, y + 5.5, x - 4, y + 7.7, x + 5, y + 9.5);
    shape.bezierCurveTo(x + 14, y + 7.7, x + 16, y + 5.5, x + 16, y + 3.5);
    shape.bezierCurveTo(x + 16, y + 3.5, x + 16, y, x + 10, y);
    shape.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5);

    const extrudeSettings = {
      depth: 2,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 2,
      bevelSize: 0.5,
      bevelThickness: 0.5
    };

    return new ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} geometry={heartGeometry} scale={scale * 0.02}>
      <meshStandardMaterial 
        color={color} 
        metalness={0.3} 
        roughness={0.4}
        emissive={color}
        emissiveIntensity={0.1}
      />
    </mesh>
  );
};

export default Heart3D;