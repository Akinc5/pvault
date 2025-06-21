# Patient Vault - Secure Medical Records Platform

A modern, secure medical records management platform built with React, TypeScript, and Supabase. Features AI-powered medical assistance, real-time health monitoring, and comprehensive medical data management.

## 🌟 Features

### 🏥 Medical Records Management
- **Secure Storage**: HIPAA-compliant encrypted storage for all medical documents
- **Multiple Formats**: Support for PDF, JPG, PNG medical documents
- **Categorization**: Organize records by type (prescriptions, lab results, imaging, checkups)
- **Vitals Tracking**: Record and monitor weight, height, blood pressure, heart rate, blood sugar

### 🤖 AI Medical Assistant (Dr. AIVA)
- **Intelligent Responses**: AI-powered medical information and guidance
- **Multiple AI Providers**: OpenRouter, OpenAI, and Google Gemini integration
- **Medical Knowledge Base**: Comprehensive fallback system with medical expertise
- **Safety First**: Built-in safeguards and emergency resource recommendations

### 📊 Health Monitoring
- **Real-time Visualization**: Interactive health metrics dashboard
- **BMI Calculator**: Automatic BMI calculation and health category assessment
- **Heart Rate Monitoring**: Visual heart rate tracking with ECG-style display
- **Health Trends**: Track vital signs over time

### 🚨 Emergency Features
- **Emergency Mode**: Quick access to critical health information
- **QR Code Generation**: Instant access for first responders
- **Emergency Contacts**: Secure storage of emergency contact information
- **Blood Type Display**: Prominent display of critical medical information

### 🔐 Security & Privacy
- **Row Level Security**: Database-level security ensuring users only access their data
- **Encrypted Storage**: All files encrypted in transit and at rest
- **Secure Sharing**: Time-limited, view-restricted sharing capabilities
- **HIPAA Compliance**: Built with healthcare privacy standards in mind

### 📱 Modern User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Glassmorphic UI**: Beautiful, modern interface with smooth animations
- **Real-time Updates**: Live data synchronization across devices
- **Offline Fallback**: Comprehensive offline medical knowledge base

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd patient-vault
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   # Supabase Configuration (Required)
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # AI Services (Optional - for enhanced chatbot)
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the provided migrations in `supabase/migrations/`
   - Configure Row Level Security policies
   - Set up storage buckets for file uploads

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🏗️ Architecture

### Frontend Stack
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful, consistent icons

### Backend & Database
- **Supabase** - PostgreSQL database with real-time capabilities
- **Row Level Security** - Database-level security policies
- **Storage** - Encrypted file storage for medical documents
- **Authentication** - Secure user authentication and session management

### AI Integration
- **OpenRouter** - Primary AI service with multiple model access
- **OpenAI GPT-4** - Fallback AI service for medical assistance
- **Google Gemini** - Alternative AI provider
- **Local Knowledge Base** - Comprehensive medical information fallback

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── ChatBot/         # AI medical assistant
│   ├── PrescriptionUpload/ # Prescription management
│   └── ...              # Other UI components
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries and configurations
├── types.ts             # TypeScript type definitions
└── main.tsx            # Application entry point

supabase/
├── migrations/          # Database schema migrations
└── ...                 # Supabase configuration
```

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Apply database migrations from `supabase/migrations/`
3. Configure authentication settings
4. Set up storage buckets:
   - `medical-files` (private)
   - `prescriptions` (private)

### AI Services Setup
The application supports multiple AI providers for enhanced functionality:

- **OpenRouter**: Recommended for cost-effective access to multiple AI models
- **OpenAI**: Direct integration with GPT models
- **Google Gemini**: Alternative AI provider

All AI services are optional - the app includes a comprehensive medical knowledge base as fallback.

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Netlify
1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Configure environment variables in Netlify dashboard

### Deploy to Vercel
1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

## 🔒 Security Features

- **Authentication**: Secure user registration and login
- **Authorization**: Row-level security ensuring data isolation
- **Encryption**: All data encrypted in transit and at rest
- **File Security**: Secure file upload and access controls
- **Session Management**: Secure session handling and automatic logout
- **Input Validation**: Comprehensive input sanitization and validation

## 🏥 Medical Compliance

- **HIPAA Considerations**: Built with healthcare privacy standards in mind
- **Data Minimization**: Only collect necessary medical information
- **Audit Trails**: Comprehensive logging for compliance requirements
- **Secure Sharing**: Time-limited, controlled access sharing
- **Emergency Access**: Secure emergency information access

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please contact [support@patientvault.com](mailto:support@patientvault.com) or open an issue on GitHub.

## 🙏 Acknowledgments

- Built with [Bolt.new](https://bolt.new) - AI-powered development platform
- Medical icons and illustrations from [Lucide](https://lucide.dev)
- UI components inspired by modern healthcare applications
- Security best practices from healthcare industry standards

---

**⚠️ Medical Disclaimer**: This application is for informational purposes only and does not provide medical advice. Always consult with qualified healthcare professionals for medical decisions and emergency situations.