import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  FileText, 
  Pill, 
  User, 
  Activity, 
  Heart, 
  Upload, 
  Share2, 
  AlertTriangle,
  Plus,
  Clock,
  TrendingUp,
  Sparkles,
  Zap,
  Star
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useMedicalData } from '../hooks/useMedicalData';
import GlassmorphicCard from './GlassmorphicCard';
import MedicalTimeline from './MedicalTimeline';
import PrescriptionUpload from './PrescriptionUpload/PrescriptionUpload';
import ShareAccess from './ShareAccess';
import EmergencyMode from './EmergencyMode';
import ChatBot from './ChatBot/ChatBot';
import AddRecordModal from './AddRecordModal';

interface MousePosition {
  x: number;
  y: number;
}

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  mousePosition: MousePosition;
}

const Card3D: React.FC<Card3DProps> = ({ children, className = '', mousePosition }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const calculateTransform = () => {
    if (!isHovered) return 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    
    const rotateX = (mousePosition.y - 0.5) * 10;
    const rotateY = (mousePosition.x - 0.5) * -10;
    
    return `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  };

  return (
    <div
      className={`transform-gpu transition-all duration-300 ease-out ${className}`}
      style={{
        transform: calculateTransform(),
        transformStyle: 'preserve-3d'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { medicalRecords, prescriptions, timelineEvents, loading, addMedicalRecord, uploadFile } = useMedicalData(user?.id || null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showUpload, setShowUpload] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const recentRecords = medicalRecords?.slice(0, 3) || [];
  const recentPrescriptions = prescriptions?.slice(0, 3) || [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'records', label: 'Records', icon: FileText },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'trends', label: 'Health Trends', icon: TrendingUp },
    { id: 'xray', label: 'X-Ray Viewer', icon: Zap },
    { id: '3d', label: '3D Visualization', icon: Star }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Patient Vault
                </h1>
                <p className="text-sm text-gray-600">Welcome back, {user?.name || user?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddRecord(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl hover:from-green-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                <span>Add Record</span>
              </button>
              
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Upload className="h-4 w-4" />
                <span>Upload</span>
              </button>
              
              <button
                onClick={() => setShowShare(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl hover:from-indigo-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
              
              <button
                onClick={() => setShowEmergency(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Emergency</span>
              </button>
              
              <button
                onClick={signOut}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white/60 backdrop-blur-xl border-b border-white/20 sticky top-[73px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto py-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card3D mousePosition={mousePosition}>
                <GlassmorphicCard className="p-6 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Medical Records</p>
                      <p className="text-3xl font-bold text-gray-900">{medicalRecords?.length || 0}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </GlassmorphicCard>
              </Card3D>

              <Card3D mousePosition={mousePosition}>
                <GlassmorphicCard className="p-6 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Prescriptions</p>
                      <p className="text-3xl font-bold text-gray-900">{prescriptions?.length || 0}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                      <Pill className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </GlassmorphicCard>
              </Card3D>

              <Card3D mousePosition={mousePosition}>
                <GlassmorphicCard className="p-6 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Health Score</p>
                      <p className="text-3xl font-bold text-gray-900">85%</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </GlassmorphicCard>
              </Card3D>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card3D mousePosition={mousePosition}>
                <GlassmorphicCard className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
                      Recent Records
                    </h3>
                    <button 
                      onClick={() => setActiveTab('records')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-4">
                    {recentRecords.map((record) => (
                      <div key={record.id} className="flex items-center space-x-4 p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-colors duration-200">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{record.title}</p>
                          <p className="text-sm text-gray-600">{record.doctorName} • {record.visitDate}</p>
                        </div>
                      </div>
                    ))}
                    {recentRecords.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No records yet</p>
                    )}
                  </div>
                </GlassmorphicCard>
              </Card3D>

              <Card3D mousePosition={mousePosition}>
                <GlassmorphicCard className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-green-500" />
                      Recent Prescriptions
                    </h3>
                    <button 
                      onClick={() => setActiveTab('prescriptions')}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-4">
                    {recentPrescriptions.map((prescription) => (
                      <div key={prescription.id} className="flex items-center space-x-4 p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-colors duration-200">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Pill className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{prescription.file_name}</p>
                          <p className="text-sm text-gray-600">Status: {prescription.status}</p>
                        </div>
                      </div>
                    ))}
                    {recentPrescriptions.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No prescriptions yet</p>
                    )}
                  </div>
                </GlassmorphicCard>
              </Card3D>
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <Card3D mousePosition={mousePosition}>
            <GlassmorphicCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Medical Records</h2>
                <button 
                  onClick={() => setShowAddRecord(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Record</span>
                </button>
              </div>
              <div className="space-y-4">
                {medicalRecords?.map((record) => (
                  <div key={record.id} className="p-4 bg-white/50 rounded-lg hover:bg-white/70 transition-colors duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{record.title}</h3>
                        <p className="text-gray-600 mt-1">{record.doctorName}</p>
                        <p className="text-sm text-gray-500 mt-2">Visit Date: {record.visitDate}</p>
                        {record.fileUrl && (
                          <a 
                            href={record.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                          >
                            View Document ({record.fileType})
                          </a>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        {record.category}
                      </span>
                    </div>
                  </div>
                ))}
                {(!medicalRecords || medicalRecords.length === 0) && (
                  <p className="text-gray-500 text-center py-8">No medical records uploaded yet</p>
                )}
              </div>
            </GlassmorphicCard>
          </Card3D>
        )}

        {activeTab === 'prescriptions' && (
          <Card3D mousePosition={mousePosition}>
            <GlassmorphicCard className="p-6">
              <PrescriptionUpload userId={user?.id || ''} />
            </GlassmorphicCard>
          </Card3D>
        )}

        {activeTab === 'timeline' && (
          <Card3D mousePosition={mousePosition}>
            <GlassmorphicCard className="p-6">
              <MedicalTimeline events={timelineEvents || []} />
            </GlassmorphicCard>
          </Card3D>
        )}

        {activeTab === 'trends' && (
          <Card3D mousePosition={mousePosition}>
            <GlassmorphicCard className="p-6">
              <HealthTrendChart medicalRecords={medicalRecords || []} />
            </GlassmorphicCard>
          </Card3D>
        )}

        {activeTab === 'xray' && (
          <Card3D mousePosition={mousePosition}>
            <GlassmorphicCard className="p-6">
              <XRayViewer />
            </GlassmorphicCard>
          </Card3D>
        )}

        {activeTab === '3d' && (
          <Card3D mousePosition={mousePosition}>
            <GlassmorphicCard className="p-6">
              <Scene3D />
            </GlassmorphicCard>
          </Card3D>
        )}
      </main>

      {/* Modals */}
      {showAddRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-modal-enter">
            <AddRecordModal 
              onClose={() => setShowAddRecord(false)}
              onSave={addMedicalRecord}
              onUploadFile={uploadFile}
            />
          </div>
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-modal-enter">
            <PrescriptionUpload 
              userId={user?.id || ''}
              onClose={() => setShowUpload(false)} 
            />
          </div>
        </div>
      )}

      {showShare && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-modal-enter">
            <ShareAccess 
              records={medicalRecords || []}
              onClose={() => setShowShare(false)} 
            />
          </div>
        </div>
      )}

      {showEmergency && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-modal-enter">
            <EmergencyMode 
              user={user!}
              onClose={() => setShowEmergency(false)} 
            />
          </div>
        </div>
      )}

      {/* ChatBot */}
      <ChatBot 
        user={user}
        medicalRecords={medicalRecords || []}
        currentPage={activeTab}
      />
    </div>
  );
};

export default Dashboard;