import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { motion } from 'framer-motion';
import { MedicalRecord } from '../types';

interface HealthTrendChartProps {
  medicalRecords: MedicalRecord[];
}

export const HealthTrendChart: React.FC<HealthTrendChartProps> = ({ medicalRecords }) => {
  // Process medical records to extract health trends
  const processHealthData = () => {
    const weightData: Array<{ date: string; value: number; normal?: boolean }> = [];
    const bpData: Array<{ date: string; value: number; normal?: boolean }> = [];
    const heartRateData: Array<{ date: string; value: number; normal?: boolean }> = [];
    const bloodSugarData: Array<{ date: string; value: number; normal?: boolean }> = [];

    medicalRecords.forEach(record => {
      const date = new Date(record.visitDate).toLocaleDateString();
      
      if (record.weight) {
        weightData.push({
          date,
          value: record.weight,
          normal: record.weight >= 50 && record.weight <= 100 // Example normal range
        });
      }
      
      if (record.bloodPressure) {
        // Extract systolic pressure for trending
        const systolic = parseInt(record.bloodPressure.split('/')[0]);
        if (!isNaN(systolic)) {
          bpData.push({
            date,
            value: systolic,
            normal: systolic >= 90 && systolic <= 140
          });
        }
      }
      
      if (record.heartRate) {
        heartRateData.push({
          date,
          value: record.heartRate,
          normal: record.heartRate >= 60 && record.heartRate <= 100
        });
      }
      
      if (record.bloodSugar) {
        bloodSugarData.push({
          date,
          value: record.bloodSugar,
          normal: record.bloodSugar >= 70 && record.bloodSugar <= 140
        });
      }
    });

    return { weightData, bpData, heartRateData, bloodSugarData };
  };

  const { weightData, bpData, heartRateData, bloodSugarData } = processHealthData();

  const TrendChart: React.FC<{
    title: string;
    data: Array<{ date: string; value: number; normal?: boolean }>;
    color: string;
    unit: string;
  }> = ({ title, data, color, unit }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/20 backdrop-blur-xl rounded-3xl p-6 border border-white/30 shadow-2xl"
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <span>{title}</span>
      </h3>
      
      {data.length > 0 ? (
        <>
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
        </>
      ) : (
        <div className="h-48 flex items-center justify-center text-gray-500">
          <p>No {title.toLowerCase()} data available</p>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Health Trends
        </h2>
        <p className="text-gray-600">Track your vital signs and health metrics over time</p>
      </div>

      {/* Check if we have any data */}
      {weightData.length === 0 && bpData.length === 0 && heartRateData.length === 0 && bloodSugarData.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Health Data Available</h3>
          <p className="text-gray-600 mb-6">Add medical records with vital signs to see your health trends</p>
          <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-blue-700">
              💡 <strong>Tip:</strong> When adding medical records, include vital signs like weight, blood pressure, heart rate, and blood sugar to track your health trends over time.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {weightData.length > 0 && (
            <TrendChart
              title="Weight"
              data={weightData}
              color="bg-blue-500"
              unit="kg"
            />
          )}
          
          {bpData.length > 0 && (
            <TrendChart
              title="Blood Pressure (Systolic)"
              data={bpData}
              color="bg-red-500"
              unit="mmHg"
            />
          )}
          
          {heartRateData.length > 0 && (
            <TrendChart
              title="Heart Rate"
              data={heartRateData}
              color="bg-green-500"
              unit="bpm"
            />
          )}
          
          {bloodSugarData.length > 0 && (
            <TrendChart
              title="Blood Sugar"
              data={bloodSugarData}
              color="bg-purple-500"
              unit="mg/dL"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default HealthTrendChart;