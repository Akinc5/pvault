import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, Activity, TrendingUp } from 'lucide-react';
import { User } from '../../types';

interface HeartRateVisualizationProps {
  user: User;
  className?: string;
}

const HeartRateVisualization: React.FC<HeartRateVisualizationProps> = ({ user, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Simulate heart rate data
  const generateHeartRateData = () => {
    const baseRate = 72; // Normal resting heart rate
    const variation = 8;
    const data: number[] = [];
    
    for (let i = 0; i < 50; i++) {
      const rate = baseRate + Math.sin(i * 0.2) * variation + (Math.random() - 0.5) * 4;
      data.push(Math.max(60, Math.min(100, rate)));
    }
    
    return data;
  };

  const heartRateData = generateHeartRateData();
  const currentHeartRate = Math.round(heartRateData[heartRateData.length - 1]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationTime = 0;

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw heart rate line
      ctx.beginPath();
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const padding = 40;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;
      const stepX = chartWidth / (heartRateData.length - 1);

      // Normalize heart rate data to chart height
      const minRate = Math.min(...heartRateData);
      const maxRate = Math.max(...heartRateData);
      const rateRange = maxRate - minRate;

      heartRateData.forEach((rate, index) => {
        const x = padding + index * stepX;
        const normalizedRate = (rate - minRate) / rateRange;
        const y = padding + chartHeight - (normalizedRate * chartHeight);

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw animated pulse effect
      const pulseX = padding + (heartRateData.length - 1) * stepX;
      const pulseY = padding + chartHeight - ((heartRateData[heartRateData.length - 1] - minRate) / rateRange * chartHeight);
      
      const pulseRadius = 8 + Math.sin(animationTime * 0.1) * 4;
      const pulseOpacity = 0.6 + Math.sin(animationTime * 0.1) * 0.4;

      ctx.beginPath();
      ctx.arc(pulseX, pulseY, pulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(59, 130, 246, ${pulseOpacity})`;
      ctx.fill();

      // Draw grid lines
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.3)';
      ctx.lineWidth = 1;

      // Horizontal grid lines
      for (let i = 0; i <= 4; i++) {
        const y = padding + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }

      // Vertical grid lines
      for (let i = 0; i <= 10; i++) {
        const x = padding + (chartWidth / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
      }

      animationTime += 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [heartRateData]);

  const getHeartRateStatus = (rate: number) => {
    if (rate < 60) return { status: 'Low', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (rate > 100) return { status: 'High', color: 'text-red-600', bg: 'bg-red-100' };
    return { status: 'Normal', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const heartRateStatus = getHeartRateStatus(currentHeartRate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden ${className}`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Heart Rate Monitor</h3>
              <p className="text-gray-600">Real-time cardiovascular tracking</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold text-gray-900">{currentHeartRate}</span>
              <span className="text-gray-600">BPM</span>
            </div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${heartRateStatus.bg} ${heartRateStatus.color}`}>
              <Activity className="w-4 h-4 mr-1" />
              {heartRateStatus.status}
            </div>
          </div>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-64 rounded-xl"
            style={{ background: 'transparent' }}
          />
          
          {/* Overlay stats */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center space-x-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-gray-700">Avg: {Math.round(heartRateData.reduce((a, b) => a + b, 0) / heartRateData.length)} BPM</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Resting</p>
            <p className="text-lg font-bold text-gray-900">72 BPM</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Max Today</p>
            <p className="text-lg font-bold text-gray-900">{Math.round(Math.max(...heartRateData))} BPM</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Min Today</p>
            <p className="text-lg font-bold text-gray-900">{Math.round(Math.min(...heartRateData))} BPM</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HeartRateVisualization;