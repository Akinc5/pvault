import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Float } from '@react-three/drei';
import Heart3D from './Heart3D';
import Brain3D from './Brain3D';
import Stethoscope3D from './Stethoscope3D';
import { Loader2 } from 'lucide-react';

interface Scene3DProps {
  type: 'heart' | 'brain' | 'stethoscope';
  className?: string;
  interactive?: boolean;
}

const Scene3D: React.FC<Scene3DProps> = ({ type, className = '', interactive = true }) => {
  const renderModel = () => {
    switch (type) {
      case 'heart':
        return (
          <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
            <Heart3D scale={1.5} />
          </Float>
        );
      case 'brain':
        return (
          <Float speed={1} rotationIntensity={0.3} floatIntensity={0.3}>
            <Brain3D scale={0.8} />
          </Float>
        );
      case 'stethoscope':
        return (
          <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
            <Stethoscope3D scale={0.6} />
          </Float>
        );
      default:
        return null;
    }
  };

  const LoadingFallback = () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className={`w-full h-full ${className}`}>
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ background: 'transparent' }}
          gl={{ antialias: true, alpha: true }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <pointLight position={[-10, -10, -5]} intensity={0.5} color="#60a5fa" />
            
            {renderModel()}
            
            <Environment preset="studio" />
            
            {interactive && (
              <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.5}
              />
            )}
          </Suspense>
        </Canvas>
      </Suspense>
    </div>
  );
};

export default Scene3D;