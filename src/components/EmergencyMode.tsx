import React, { useState, useEffect } from 'react';
import { AlertTriangle, Phone, User as UserIcon, ArrowLeft, QrCode, Download, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { User } from '../types';

interface EmergencyModeProps {
  user: User;
  onBack: () => void;
}

const EmergencyMode: React.FC<EmergencyModeProps> = ({ user, onBack }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [emergencyUrl, setEmergencyUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Generate emergency access URL (would be a real URL in production)
    const emergencyAccessUrl = `${window.location.origin}/emergency/${user.id}`;
    setEmergencyUrl(emergencyAccessUrl);

    // Generate QR code
    QRCode.toDataURL(emergencyAccessUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#1f2937',
        light: '#ffffff',
      },
    })
      .then(setQrCodeDataUrl)
      .catch(console.error);
  }, [user.id]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(emergencyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.download = `emergency-qr-${user.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            
            <div className="flex items-center space-x-3 ml-6">
              <div className="p-2 bg-red-600 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Emergency Mode
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-6 py-3 bg-red-100 text-red-800 rounded-full mb-4">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">Emergency Information Panel</span>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            This panel provides quick access to critical health information during emergencies. 
            Share the QR code or URL with first responders or medical personnel.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Critical Information Card */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-600">{user.age} years old • {user.gender}</p>
            </div>

            <div className="space-y-6">
              {/* Blood Type - Most Critical */}
              <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200">
                <h3 className="text-lg font-bold text-red-800 mb-2 flex items-center space-x-2">
                  <span className="text-2xl">🩸</span>
                  <span>Blood Type</span>
                </h3>
                <p className="text-3xl font-bold text-red-600">{user.bloodType}</p>
              </div>

              {/* Allergies */}
              {user.allergies.length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-6 border-2 border-yellow-200">
                  <h3 className="text-lg font-bold text-yellow-800 mb-3 flex items-center space-x-2">
                    <span className="text-2xl">⚠️</span>
                    <span>Critical Allergies</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {user.allergies.map((allergy, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-yellow-100 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <span className="font-semibold text-yellow-800">{allergy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center space-x-2">
                  <Phone className="w-5 h-5" />
                  <span>Emergency Contact</span>
                </h3>
                <div className="space-y-2">
                  <p className="font-semibold text-blue-800">{user.emergencyContact.name}</p>
                  <p className="text-blue-600">{user.emergencyContact.relationship}</p>
                  <a
                    href={`tel:${user.emergencyContact.phone}`}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{user.emergencyContact.phone}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code and Sharing */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-full mb-4">
                <QrCode className="w-5 h-5" />
                <span className="font-semibold">Quick Access</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Emergency QR Code</h3>
              <p className="text-gray-600">
                Scan this code to access emergency information instantly
              </p>
            </div>

            {/* QR Code Display */}
            <div className="bg-white rounded-lg p-6 mb-6 shadow border border-gray-200">
              <div className="flex justify-center">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Emergency QR Code"
                    className="w-64 h-64 rounded-lg"
                  />
                ) : (
                  <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <button
                onClick={handleDownloadQR}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Download QR Code</span>
              </button>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={emergencyUrl}
                  readOnly
                  className="flex-1 p-3 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={handleCopyUrl}
                  className="flex items-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-800 mb-1">Important Note</h4>
                  <p className="text-sm text-amber-700">
                    This emergency access is public and should only be shared with trusted individuals or first responders during emergencies.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
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

export default EmergencyMode;