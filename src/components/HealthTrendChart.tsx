import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { motion } from 'framer-motion';

interface HealthTrendChartProps {
  title: string;
  data: Array<{
    date: string;
    value: number;
    normal?: boolean;
  }>;
  color: string;
  unit: string;
}

const HealthTrendChart: React.FC<HealthTrendChartProps> = ({ title, data, color, unit }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/20 backdrop-blur-xl rounded-3xl p-6 border border-white/30 shadow-2xl"
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${color}`}></div>
        <span>{title}</span>
      </h3>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color.includes('blue') ? '#3b82f6' : color.includes('red') ? '#ef4444' : '#10b981'} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color.includes('blue') ? '#3b82f6' : color.includes('red') ? '#ef4444' : '#10b981'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
            <XAxis 
              dataKey="date" 
              stroke="rgba(255,255,255,0.7)"
              fontSize={12}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.7)"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
              }}
              formatter={(value) => [`${value} ${unit}`, title]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color.includes('blue') ? '#3b82f6' : color.includes('red') ? '#ef4444' : '#10b981'}
              strokeWidth={3}
              fill={`url(#gradient-${title})`}
              dot={{ fill: color.includes('blue') ? '#3b82f6' : color.includes('red') ? '#ef4444' : '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex justify-between items-center text-sm">
        <span className="text-gray-600">Latest: {data[data.length - 1]?.value} {unit}</span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          data[data.length - 1]?.normal 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {data[data.length - 1]?.normal ? 'Normal' : 'Monitor'}
        </span>
      </div>
    </motion.div>
  );
};

export default HealthTrendChart;