import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User as UserIcon,
  Minimize2,
  Maximize2,
  AlertTriangle,
  Heart,
  Brain,
  FileText,
  Activity,
  Stethoscope,
  Pill,
  ArrowLeft,
  Smartphone,
  Monitor,
  Shield,
  Zap,
  Phone,
  ExternalLink,
  Sparkles,
  Moon,
  Sun
} from 'lucide-react';
import { User, MedicalRecord } from '../../types';
import { generateChatResponse } from './chatbotService';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  isEmergency?: boolean;
}

interface ChatBotProps {
  user: User | null;
  medicalRecords: MedicalRecord[];
  currentPage?: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ user, medicalRecords, currentPage = 'dashboard' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initial greeting message with medical focus
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: Message = {
        id: 'greeting',
        type: 'bot',
        content: `Hello${user ? ` ${user.name}` : ''}! 👋 I'm **Dr. AIVA**, your AI Virtual Medical Assistant.\n\nI'm here to help with:\n🩺 **Medical Questions** - Symptoms, conditions, treatments\n🧠 **Mental Health** - Stress, anxiety, depression support\n💊 **Medications** - Information about prescriptions\n🏃‍♂️ **Lifestyle** - Nutrition, exercise, sleep advice\n📋 **Your Records** - Understanding your medical data\n\n⚠️ **Important:** I'm an AI assistant, not a licensed medical professional. For emergencies or serious health concerns, please consult a real doctor immediately.\n\nWhat can I help you with today?`,
        timestamp: new Date()
      };
      setMessages([greeting]);
    }
  }, [isOpen, user, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Prevent body scroll when mobile chat is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, isOpen]);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const simulateTyping = async (response: string, isEmergency = false) => {
    setIsTyping(true);
    
    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing',
      type: 'bot',
      content: '',
      timestamp: new Date(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);

    // Simulate realistic typing delay based on response length
    const typingDelay = Math.min(Math.max(response.length * 15, 800), 2500);
    await new Promise(resolve => setTimeout(resolve, typingDelay));

    // Remove typing indicator and add actual response
    setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
    addMessage({ type: 'bot', content: response, isEmergency });
    setIsTyping(false);
  };

  const checkForEmergencyKeywords = (input: string): boolean => {
    const emergencyKeywords = [
      'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
      'self harm', 'hurt myself', 'overdose', 'emergency', 'urgent',
      'chest pain', 'can\'t breathe', 'heart attack', 'stroke',
      'severe pain', 'bleeding heavily', 'unconscious', 'poisoned'
    ];
    
    const lowerInput = input.toLowerCase();
    return emergencyKeywords.some(keyword => lowerInput.includes(keyword));
  };

  const generateEmergencyResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('suicide') || lowerInput.includes('suicidal') || 
        lowerInput.includes('kill myself') || lowerInput.includes('end my life') ||
        lowerInput.includes('want to die')) {
      return `🚨 **IMMEDIATE HELP NEEDED**\n\nI'm very concerned about what you've shared. Your life has value and there are people who want to help.\n\n**Please reach out immediately:**\n\n🇺🇸 **National Suicide Prevention Lifeline**\n📞 **988** (24/7 free support)\n💬 **Text "HELLO" to 741741**\n\n🇬🇧 **Samaritans (UK)**\n📞 **116 123** (free, 24/7)\n\n**If you're in immediate danger:**\n🚨 **Call 911 (US) or 999 (UK)**\n🏥 **Go to your nearest emergency room**\n\nYou don't have to go through this alone. Professional help is available right now.`;
    }
    
    if (lowerInput.includes('chest pain') || lowerInput.includes('heart attack') ||
        lowerInput.includes('can\'t breathe') || lowerInput.includes('stroke')) {
      return `🚨 **MEDICAL EMERGENCY**\n\nThese symptoms require immediate medical attention!\n\n**Call emergency services NOW:**\n🚨 **911 (US) / 999 (UK) / 112 (EU)**\n🏥 **Go to the nearest emergency room**\n\nDon't wait - get medical help immediately. Time is critical for these symptoms.`;
    }
    
    return `🚨 **EMERGENCY SUPPORT**\n\nI'm concerned about your situation. Please consider getting immediate help:\n\n**Emergency Services:**\n🚨 **911 (US) / 999 (UK) / 112 (EU)**\n\n**Crisis Support:**\n📞 **988** - National Suicide Prevention Lifeline\n💬 **Text "HELLO" to 741741** - Crisis Text Line\n\nYour safety is the top priority. Please reach out to professionals who can provide immediate assistance.`;
  };

  const checkForInappropriateQuestions = (input: string): string | null => {
    const lowerInput = input.toLowerCase();
    
    // Check for emergency situations first
    if (checkForEmergencyKeywords(input)) {
      return generateEmergencyResponse(input);
    }
    
    // Dosage and medication advice
    if ((lowerInput.includes('dose') || lowerInput.includes('dosage') || 
        lowerInput.includes('how much') || lowerInput.includes('how many')) &&
        (lowerInput.includes('take') || lowerInput.includes('medication') || 
         lowerInput.includes('medicine') || lowerInput.includes('pill'))) {
      return "⚠️ **Medical Advice Limitation**\n\nI cannot provide specific dosage recommendations. Medication dosing must be determined by qualified healthcare professionals.\n\n**Please consult:**\n👨‍⚕️ Your prescribing doctor\n💊 Your pharmacist\n📋 The medication label/package insert\n\n**For urgent medication questions:**\n📞 Call your pharmacy or doctor's office\n🏥 Contact poison control if you've taken too much: **1-800-222-1222**";
    }
    
    // Stopping medications
    if ((lowerInput.includes('stop') || lowerInput.includes('quit') || lowerInput.includes('discontinue')) &&
        (lowerInput.includes('medication') || lowerInput.includes('medicine') || lowerInput.includes('pill'))) {
      return "⚠️ **Important Medication Safety**\n\nNever stop medications without consulting your doctor first. Stopping medications abruptly can be dangerous and may cause:\n\n• Withdrawal symptoms\n• Return of your condition\n• Serious health complications\n\n**Always speak with your healthcare provider before making any changes to your medications.**";
    }
    
    // Diagnosis requests
    if (lowerInput.includes('do i have') || lowerInput.includes('am i sick') || 
        lowerInput.includes('what disease') || lowerInput.includes('diagnose me')) {
      return "⚠️ **Diagnosis Limitation**\n\nI cannot provide medical diagnoses. Only licensed healthcare professionals can properly diagnose medical conditions after:\n\n🔍 Physical examination\n🩺 Medical history review\n🧪 Appropriate tests\n📋 Clinical assessment\n\n**If you're concerned about symptoms:**\n👨‍⚕️ Schedule an appointment with your doctor\n🏥 Visit urgent care for non-emergency concerns\n🚨 Call 911 for emergencies";
    }
    
    return null;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message
    addMessage({ type: 'user', content: userMessage });

    // Check for inappropriate questions first
    const warningResponse = checkForInappropriateQuestions(userMessage);
    if (warningResponse) {
      const isEmergency = checkForEmergencyKeywords(userMessage);
      await simulateTyping(warningResponse, isEmergency);
      
      if (isEmergency) {
        setShowEmergencyModal(true);
      }
      return;
    }

    try {
      // Generate AI response
      const response = await generateChatResponse(
        userMessage, 
        user, 
        medicalRecords, 
        currentPage,
        messages
      );
      
      await simulateTyping(response);
    } catch (error) {
      console.error('Error generating chat response:', error);
      await simulateTyping("I apologize, but I'm having trouble processing your request right now. Please try again in a moment, or contact your healthcare provider if this is urgent.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const quickActions = [
    { text: "How do I manage stress and anxiety?", icon: Brain, category: "Mental Health" },
    { text: "What does my blood pressure reading mean?", icon: Activity, category: "Medical" },
    { text: "Help me understand my medications", icon: Pill, category: "Medications" },
    { text: "Tips for better sleep and nutrition", icon: Heart, category: "Lifestyle" },
    { text: "How do I upload a medical document?", icon: FileText, category: "App Help" },
    { text: "Explain my recent lab results", icon: Stethoscope, category: "Records" },
  ];

  const handleQuickAction = (text: string) => {
    setInputValue(text);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    // Clear messages when closing
    setMessages([]);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const themeClasses = isDarkMode ? {
    bg: 'bg-gray-900/95',
    text: 'text-white',
    border: 'border-gray-700/50',
    input: 'bg-gray-800 border-gray-600 text-white',
    userBubble: 'bg-blue-600 text-white',
    botBubble: 'bg-gray-800 text-gray-100',
    quickAction: 'bg-gray-800 hover:bg-gray-700 border-gray-600'
  } : {
    bg: 'bg-white/95',
    text: 'text-gray-800',
    border: 'border-white/20',
    input: 'bg-gray-50 border-gray-200 text-gray-900',
    userBubble: 'bg-blue-500 text-white',
    botBubble: 'bg-gray-100 text-gray-800',
    quickAction: 'bg-white hover:bg-gray-50 border-gray-200'
  };

  // Floating chat bubble - only show when closed
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleOpen}
          className="w-16 h-16 bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:shadow-3xl transition-all duration-300 relative group"
        >
          <Bot className="w-8 h-8" />
          
          {/* Pulsing animation */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 animate-ping opacity-20"></div>
          
          {/* Glowing effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 opacity-30 blur-lg group-hover:opacity-50 transition-opacity duration-300"></div>
        </motion.button>
        
        {/* Floating label */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute right-20 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg"
        >
          <div className="flex items-center space-x-2">
            <Stethoscope className="w-4 h-4" />
            <span>Ask Dr. AIVA</span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
        </motion.div>
      </div>
    );
  }

  // Mobile fullscreen layout
  if (isMobile) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={`fixed inset-0 z-50 ${themeClasses.bg} backdrop-blur-xl flex flex-col`}
        >
          {/* Mobile Header */}
          <div className="bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 text-white p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Dr. AIVA</h3>
                <p className="text-sm opacity-90">AI Medical Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Toggle theme"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Close Dr. AIVA"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Mobile Messages */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-[85%] ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : message.isEmergency
                      ? 'bg-red-500 text-white'
                      : 'bg-gradient-to-r from-teal-400 to-blue-400 text-white'
                  }`}>
                    {message.type === 'user' ? (
                      <UserIcon className="w-5 h-5" />
                    ) : message.isEmergency ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? themeClasses.userBubble
                      : message.isEmergency
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : themeClasses.botBubble
                  }`}>
                    {message.isTyping ? (
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content.split('**').map((part, index) => 
                            index % 2 === 1 ? <strong key={index}>{part}</strong> : part
                          )}
                        </div>
                        <p className={`text-xs mt-2 opacity-70 ${
                          message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Mobile Quick Actions */}
          {messages.length <= 1 && (
            <div className={`px-4 py-2 border-t ${themeClasses.border} ${themeClasses.bg}`}>
              <p className={`text-sm ${themeClasses.text} mb-3 font-medium`}>Quick actions:</p>
              <div className="grid grid-cols-1 gap-2">
                {quickActions.slice(0, 4).map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.text)}
                    className={`flex items-center space-x-3 p-3 ${themeClasses.quickAction} rounded-xl text-sm transition-colors border`}
                  >
                    <action.icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">{action.category}</div>
                      <div className="text-xs opacity-70">{action.text}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mobile Input */}
          <div className={`p-4 border-t ${themeClasses.border} ${themeClasses.bg}`}>
            <div className="flex items-center space-x-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Dr. AIVA anything..."
                disabled={isTyping}
                className={`flex-1 p-4 ${themeClasses.input} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base disabled:opacity-50 transition-all duration-200`}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="p-4 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
            
            {/* Mobile Disclaimer */}
            <div className="mt-3 flex items-start space-x-2 text-xs text-gray-500">
              <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Dr. AIVA is an AI assistant, not a licensed medical professional. For emergencies, contact a real doctor.</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Desktop layout - Fixed positioning
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            height: isMinimized ? 60 : 600,
            width: 420
          }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={`${themeClasses.bg} backdrop-blur-xl rounded-2xl shadow-2xl border ${themeClasses.border} overflow-hidden flex flex-col`}
        >
          {/* Desktop Header */}
          <div className="bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 text-white p-4 flex items-center justify-between sticky top-0 z-10 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">Dr. AIVA</h3>
                <p className="text-xs opacity-90">AI Medical Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                title="Toggle theme"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                title={isMinimized ? "Expand chat" : "Minimize chat"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                title="Close Dr. AIVA"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {!isMinimized && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col flex-1 min-h-0"
              >
                {/* Desktop Messages */}
                <div 
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400"
                  style={{
                    maxHeight: '400px',
                    scrollBehavior: 'smooth'
                  }}
                >
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-2 max-w-[85%] ${
                        message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.type === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : message.isEmergency
                            ? 'bg-red-500 text-white'
                            : 'bg-gradient-to-r from-teal-400 to-blue-400 text-white'
                        }`}>
                          {message.type === 'user' ? (
                            <UserIcon className="w-4 h-4" />
                          ) : message.isEmergency ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                        </div>
                        
                        <div className={`rounded-2xl px-4 py-3 ${
                          message.type === 'user'
                            ? themeClasses.userBubble
                            : message.isEmergency
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : themeClasses.botBubble
                        }`}>
                          {message.isTyping ? (
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          ) : (
                            <>
                              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                {message.content.split('**').map((part, index) => 
                                  index % 2 === 1 ? <strong key={index}>{part}</strong> : part
                                )}
                              </div>
                              <p className={`text-xs mt-2 opacity-70 ${
                                message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {formatTime(message.timestamp)}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Desktop Quick Actions */}
                {messages.length <= 1 && (
                  <div className={`px-4 pb-2 border-t ${themeClasses.border}`}>
                    <p className={`text-xs ${themeClasses.text} mb-2 pt-2 opacity-70`}>Quick actions:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickActions.slice(0, 4).map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickAction(action.text)}
                          className={`flex items-center space-x-2 p-2 ${themeClasses.quickAction} rounded-lg text-xs transition-colors border`}
                        >
                          <action.icon className="w-3 h-3 text-gray-500 flex-shrink-0" />
                          <span className="truncate text-left">{action.category}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Desktop Input */}
                <div className={`p-4 border-t ${themeClasses.border} ${themeClasses.bg} backdrop-blur-sm sticky bottom-0`}>
                  <div className="flex items-center space-x-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask Dr. AIVA anything..."
                      disabled={isTyping}
                      className={`flex-1 p-3 ${themeClasses.input} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:opacity-50 transition-all duration-200`}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isTyping}
                      className="p-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </div>
                  
                  {/* Desktop Disclaimer */}
                  <div className="mt-2 flex items-start space-x-1 text-xs text-gray-500">
                    <Shield className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>Dr. AIVA is an AI assistant, not a licensed medical professional. For emergencies, contact a real doctor.</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Emergency Modal */}
      <AnimatePresence>
        {showEmergencyModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-red-200"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Emergency Resources
                </h3>
                
                <p className="text-gray-600 mb-6">
                  If you're in crisis, please reach out for immediate help:
                </p>
                
                <div className="space-y-3 text-left">
                  <a
                    href="tel:988"
                    className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-red-600" />
                    <div>
                      <div className="font-semibold text-red-800">988 - Crisis Lifeline</div>
                      <div className="text-sm text-red-600">24/7 suicide prevention</div>
                    </div>
                  </a>
                  
                  <a
                    href="tel:911"
                    className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <div className="font-semibold text-red-800">911 - Emergency Services</div>
                      <div className="text-sm text-red-600">Immediate medical help</div>
                    </div>
                  </a>
                  
                  <a
                    href="https://suicidepreventionlifeline.org/chat/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-semibold text-blue-800">Crisis Chat</div>
                      <div className="text-sm text-blue-600">Online support</div>
                    </div>
                  </a>
                </div>
                
                <button
                  onClick={() => setShowEmergencyModal(false)}
                  className="mt-6 w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatBot;