Patient Vault - Secure Medical Records Platform
A modern, secure medical records management platform built with React, TypeScript, and Supabase. Features AI-powered medical assistance, real-time health monitoring, and comprehensive medical data management.

🌟 Features
🏥 Medical Records Management
Secure Storage: HIPAA-compliant encrypted storage for all medical documents
Multiple Formats: Support for PDF, JPG, PNG medical documents
Categorization: Organize records by type (prescriptions, lab results, imaging, checkups)
Vitals Tracking: Record and monitor weight, height, blood pressure, heart rate, blood sugar
🤖 AI Medical Assistant (Dr. AIVA)
Intelligent Responses: AI-powered medical information and guidance
Multiple AI Providers: OpenRouter, OpenAI, and Google Gemini integration
Medical Knowledge Base: Comprehensive fallback system with medical expertise
Safety First: Built-in safeguards and emergency resource recommendations
📊 Health Monitoring
Real-time Visualization: Interactive health metrics dashboard
BMI Calculator: Automatic BMI calculation and health category assessment
Heart Rate Monitoring: Visual heart rate tracking with ECG-style display
Health Trends: Track vital signs over time
🚨 Emergency Features
Emergency Mode: Quick access to critical health information
QR Code Generation: Instant access for first responders
Emergency Contacts: Secure storage of emergency contact information
Blood Type Display: Prominent display of critical medical information
🔐 Security & Privacy
Row Level Security: Database-level security ensuring users only access their data
Encrypted Storage: All files encrypted in transit and at rest
Secure Sharing: Time-limited, view-restricted sharing capabilities
HIPAA Compliance: Built with healthcare privacy standards in mind
📱 Modern User Experience
Responsive Design: Optimized for desktop, tablet, and mobile devices
Glassmorphic UI: Beautiful, modern interface with smooth animations
Real-time Updates: Live data synchronization across devices
Offline Fallback: Comprehensive offline medical knowledge base
🚀 Quick Start
Prerequisites
Node.js 18+
npm or yarn
Supabase account
Installation
Clone the repository

git clone <repository-url>
cd patient-vault
Install dependencies

npm install
Set up environment variables

cp .env.example .env
Update .env with your configuration:

# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services (Optional - for enhanced chatbot)
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key
Set up Supabase

Create a new Supabase project
Run the provided migrations in supabase/migrations/
Configure Row Level Security policies
Set up storage buckets for file uploads
Start the development server

npm run dev
🏗️ Architecture
Frontend Stack
React 18 - Modern React with hooks and concurrent features
TypeScript - Type-safe development
Tailwind CSS - Utility-first styling
Framer Motion - Smooth animations and transitions
Lucide React - Beautiful, consistent icons
Backend & Database
Supabase - PostgreSQL database with real-time capabilities
Row Level Security - Database-level security policies
Storage - Encrypted file storage for medical documents
Authentication - Secure user authentication and session management
AI Integration
OpenRouter - Primary AI service with multiple model access
OpenAI GPT-4 - Fallback AI service for medical assistance
Google Gemini - Alternative AI provider
Local Knowledge Base - Comprehensive medical information fallback
