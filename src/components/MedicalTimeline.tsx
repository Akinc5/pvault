import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Activity, 
  Pill, 
  Stethoscope, 
  FileText, 
  AlertTriangle,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Heart,
  Thermometer,
  Weight,
  Ruler,
  TrendingUp,
  User,
  MapPin,
  Timer,
  Bot
} from 'lucide-react';
import { TimelineEvent, MedicalRecord, UploadedPrescription } from '../types';

interface MedicalTimelineProps {
  events: TimelineEvent[];
  onEventClick?: (event: TimelineEvent) => void;
}

const MedicalTimeline: React.FC<MedicalTimelineProps> = ({ events, onEventClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [timeRange, setTimeRange] = useState<'all' | '1month' | '3months' | '6months' | '1year'>('all');

  const filters = [
    { value: 'all', label: 'All Events', color: 'bg-gray-100' },
    { value: 'record', label: 'Records', color: 'bg-blue-100' },
    { value: 'prescription', label: 'Prescriptions', color: 'bg-green-100' },
    { value: 'emergency', label: 'Emergency', color: 'bg-red-100' },
  ];

  const filteredEvents = useMemo(() => {
    let filtered = events || [];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(event => event.type === selectedFilter);
    }

    // Filter by time range
    if (timeRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (timeRange) {
        case '1month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case '6months':
          cutoffDate.setMonth(now.getMonth() - 6);
          break;
        case '1year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(event => new Date(event.date) >= cutoffDate);
    }

    // Sort by date (most recent first)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [events, searchTerm, selectedFilter, timeRange]);

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const getEventIcon = (type: string, importance: string) => {
    const iconClass = `w-6 h-6 ${importance === 'critical' ? 'text-red-600' : 
                                 importance === 'high' ? 'text-orange-600' :
                                 importance === 'medium' ? 'text-blue-600' : 'text-gray-600'}`;
    
    switch (type) {
      case 'record':
        return <FileText className={iconClass} />;
      case 'prescription':
        return <Pill className={iconClass} />;
      case 'emergency':
        return <AlertTriangle className={iconClass} />;
      default:
        return <Activity className={iconClass} />;
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical':
        return 'border-red-300 bg-red-50';
      case 'high':
        return 'border-orange-300 bg-orange-50';
      case 'medium':
        return 'border-blue-300 bg-blue-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const renderRecordDetails = (record: MedicalRecord) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Doctor: {record.doctorName}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Visit Date: {record.visitDate}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Category: {record.category}</span>
          </div>
        </div>
        
        {(record.weight || record.height || record.bloodPressure || record.heartRate || record.bloodSugar) && (
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <h5 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Vitals</span>
            </h5>
            <div className="space-y-1 text-sm">
              {record.weight && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight:</span>
                  <span className="font-medium">{record.weight} kg</span>
                </div>
              )}
              {record.height && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Height:</span>
                  <span className="font-medium">{record.height} cm</span>
                </div>
              )}
              {record.bloodPressure && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Blood Pressure:</span>
                  <span className="font-medium">{record.bloodPressure}</span>
                </div>
              )}
              {record.heartRate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Heart Rate:</span>
                  <span className="font-medium">{record.heartRate} bpm</span>
                </div>
              )}
              {record.bloodSugar && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Blood Sugar:</span>
                  <span className="font-medium">{record.bloodSugar} mg/dL</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {record.fileUrl && (
        <div>
          <h5 className="font-semibold text-gray-900 mb-2">Document</h5>
          <a 
            href={record.fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>View Document ({record.fileType})</span>
          </a>
        </div>
      )}
    </div>
  );

  const renderPrescriptionDetails = (prescription: UploadedPrescription) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">File Name:</span>
            <span className="font-medium">{prescription.file_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">File Type:</span>
            <span className="font-medium">{prescription.file_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">File Size:</span>
            <span className="font-medium">{prescription.file_size}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              prescription.status === 'analyzed' ? 'bg-green-100 text-green-800' :
              prescription.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
              prescription.status === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
            </span>
          </div>
        </div>
      </div>
      
      {prescription.ai_summary && (
        <div>
          <h5 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
            <Bot className="w-4 h-4 text-blue-600" />
            <span>AI Analysis</span>
          </h5>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 whitespace-pre-wrap">{prescription.ai_summary}</p>
          </div>
        </div>
      )}
      
      <div>
        <a 
          href={prescription.file_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>View Prescription</span>
        </a>
      </div>
    </div>
  );

  const groupEventsByDate = (events: TimelineEvent[]) => {
    const grouped: { [key: string]: TimelineEvent[] } = {};
    events.forEach(event => {
      const dateKey = new Date(event.date).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  };

  const groupedEvents = groupEventsByDate(filteredEvents);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Medical Timeline
        </h2>
        <p className="text-gray-600">Your complete medical history at a glance</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search medical history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {filters.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
            
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No medical history found</p>
            <p className="text-gray-400">Your medical timeline will appear here</p>
          </div>
        ) : (
          Object.entries(groupedEvents).map(([dateKey, dayEvents]) => (
            <div key={dateKey} className="relative">
              {/* Date Header */}
              <div className="sticky top-4 z-10 mb-4">
                <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow border border-gray-200">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-gray-900">
                    {new Date(dateKey).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                  <span className="text-sm text-gray-500">({dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''})</span>
                </div>
              </div>

              {/* Events for this date */}
              <div className="space-y-4 ml-8">
                {dayEvents.map((event, index) => (
                  <div
                    key={event.id}
                    className={`relative bg-white rounded-lg shadow border-l-4 ${getImportanceColor(event.importance)} hover:shadow-lg transition-shadow`}
                  >
                    {/* Timeline connector */}
                    <div className="absolute -left-10 top-6 w-4 h-4 bg-white border-4 border-blue-600 rounded-full shadow"></div>
                    <div className="absolute -left-8 top-8 w-0.5 h-full bg-blue-200"></div>

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getEventIcon(event.type, event.importance)}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {event.title}
                            </h3>
                            <p className="text-gray-600 mb-2">{event.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              {event.time && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{event.time}</span>
                                </div>
                              )}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                event.importance === 'critical' ? 'bg-red-100 text-red-800' :
                                event.importance === 'high' ? 'bg-orange-100 text-orange-800' :
                                event.importance === 'medium' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {event.importance} priority
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => toggleEventExpansion(event.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {expandedEvents.has(event.id) ? 
                            <ChevronUp className="w-5 h-5 text-gray-500" /> : 
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          }
                        </button>
                      </div>

                      {/* Expanded Details */}
                      {expandedEvents.has(event.id) && (
                        <div className="border-t border-gray-200 pt-4">
                          {event.type === 'record' && renderRecordDetails(event.data as MedicalRecord)}
                          {event.type === 'prescription' && renderPrescriptionDetails(event.data as UploadedPrescription)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MedicalTimeline;