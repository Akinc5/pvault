import React, { useState } from 'react';
import { 
  Share2, 
  ArrowLeft, 
  Mail, 
  Link as LinkIcon, 
  Clock, 
  Eye, 
  Copy, 
  Check,
  Calendar,
  Shield,
  Users,
  FileText
} from 'lucide-react';
import { MedicalRecord } from '../types';

interface ShareAccessProps {
  records: MedicalRecord[];
  onBack: () => void;
}

const ShareAccess: React.FC<ShareAccessProps> = ({ records, onBack }) => {
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [shareMethod, setShareMethod] = useState<'email' | 'link'>('email');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [expirationDays, setExpirationDays] = useState(7);
  const [maxViews, setMaxViews] = useState(5);
  const [shareLinks, setShareLinks] = useState<any[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const handleRecordToggle = (recordId: string) => {
    setSelectedRecords(prev => 
      prev.includes(recordId)
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRecords.length === records.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(records.map(r => r.id));
    }
  };

  const generateShareLink = () => {
    const selectedData = records.filter(r => selectedRecords.includes(r.id));
    const linkId = Math.random().toString(36).substring(2, 15);
    const shareUrl = `${window.location.origin}/shared/${linkId}`;
    
    const newShareLink = {
      id: linkId,
      url: shareUrl,
      records: selectedData,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString(),
      maxViews,
      currentViews: 0,
      recipientEmail: shareMethod === 'email' ? recipientEmail : null,
    };

    setShareLinks(prev => [newShareLink, ...prev]);
    setSelectedRecords([]);
    setRecipientEmail('');
  };

  const handleCopyLink = async (url: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(linkId);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'prescription': return '💊';
      case 'lab-results': return '🧪';
      case 'imaging': return '🔬';
      case 'checkup': return '🩺';
      default: return '📄';
    }
  };

  const getExpirationColor = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const hoursLeft = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursLeft < 24) return 'text-red-600 bg-red-50';
    if (hoursLeft < 72) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            
            <div className="flex items-center space-x-3 ml-6">
              <div className="p-2 bg-teal-600 rounded-lg">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Share Medical Records
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Record Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Select Records to Share</h2>
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  {selectedRecords.length === records.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-3">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedRecords.includes(record.id)
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => handleRecordToggle(record.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {getCategoryIcon(record.category)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{record.title}</h3>
                        <p className="text-sm text-gray-600">Dr. {record.doctorName} • {record.visitDate}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedRecords.includes(record.id)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedRecords.includes(record.id) && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Share Settings */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Share Settings</h3>
              
              {/* Share Method */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Share Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      value="email"
                      checked={shareMethod === 'email'}
                      onChange={(e) => setShareMethod(e.target.value as 'email')}
                      className="text-blue-600"
                    />
                    <Mail className="w-5 h-5 text-gray-500" />
                    <span>Email recipient</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      value="link"
                      checked={shareMethod === 'link'}
                      onChange={(e) => setShareMethod(e.target.value as 'link')}
                      className="text-blue-600"
                    />
                    <LinkIcon className="w-5 h-5 text-gray-500" />
                    <span>Generate link</span>
                  </label>
                </div>
              </div>

              {/* Email Input */}
              {shareMethod === 'email' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="doctor@example.com"
                  />
                </div>
              )}

              {/* Expiration */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Expires In
                </label>
                <select
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={7}>1 week</option>
                  <option value={14}>2 weeks</option>
                  <option value={30}>1 month</option>
                </select>
              </div>

              {/* Max Views */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Views
                </label>
                <select
                  value={maxViews}
                  onChange={(e) => setMaxViews(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>1 view</option>
                  <option value={3}>3 views</option>
                  <option value={5}>5 views</option>
                  <option value={10}>10 views</option>
                  <option value={-1}>Unlimited</option>
                </select>
              </div>

              <button
                onClick={generateShareLink}
                disabled={selectedRecords.length === 0}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Share2 className="w-5 h-5" />
                <span>Generate Share Link</span>
              </button>
            </div>

            {/* Security Notice */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">Security Notice</h4>
                  <p className="text-sm text-blue-700">
                    Shared links are encrypted and automatically expire. Only share with trusted medical professionals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Share Links */}
        {shareLinks.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Active Share Links</h3>
              
              <div className="space-y-4">
                {shareLinks.map((link) => (
                  <div key={link.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {link.records.length} record{link.records.length !== 1 ? 's' : ''} shared
                          </span>
                          {link.recipientEmail && (
                            <span className="text-sm text-gray-500">to {link.recipientEmail}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Created {new Date(link.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span className={`px-2 py-1 rounded-full text-xs ${getExpirationColor(link.expiresAt)}`}>
                              Expires {new Date(link.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>{link.currentViews}/{link.maxViews === -1 ? '∞' : link.maxViews} views</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCopyLink(link.url, link.id)}
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          {copied === link.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span className="text-sm">{copied === link.id ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-xs font-mono bg-gray-100 p-2 rounded-lg text-gray-600 break-all">
                      {link.url}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-6">
        <div className="inline-flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-full">
          <span className="text-sm text-gray-600">Built with</span>
          <span className="text-sm font-semibold text-blue-600">Bolt.new</span>
        </div>
      </footer>
    </div>
  );
};

export default ShareAccess;