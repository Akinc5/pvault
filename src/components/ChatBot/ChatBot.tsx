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
  Monitor
} from 'lucide-react';
import { User, MedicalRecord } from '../../types';
import { analyzeMedicalDocument, generateChatResponse } from './chatbotService';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
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

  // Initial greeting message with disclaimer
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: Message = {
        id: 'greeting',
        type: 'bot',
        content: `Hello${user ? ` ${user.name}` : ''}! 👋 I'm Dr. AIVA, your AI Virtual Assistant. I'm here to help with health questions, analyze your medical documents, and guide you through the app.\n\n⚠️ **Important:** I'm an AI assistant, not a licensed medical professional. For emergencies or serious health concerns, please consult a real doctor immediately.\n\nHow can I assist you today?`,
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

  const simulateTyping = async (response: string) => {
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
    const typingDelay = Math.min(Math.max(response.length * 20, 1000), 3000);
    await new Promise(resolve => setTimeout(resolve, typingDelay));

    // Remove typing indicator and add actual response
    setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
    addMessage({ type: 'bot', content: response });
    setIsTyping(false);
  };

  const checkForInappropriateQuestions = (input: string): string | null => {
    const lowerInput = input.toLowerCase();
    
    // Dosage and medication advice
    if (lowerInput.includes('dose') || lowerInput.includes('dosage') || 
        lowerInput.includes('how much') || lowerInput.includes('how many')) {
      if (lowerInput.includes('take') || lowerInput.includes('medication') || 
          lowerInput.includes('medicine') || lowerInput.includes('pill')) {
        return "⚠️ I'm not qualified to give dosage advice. Please consult your doctor or pharmacist for specific medication dosing instructions.";
      }
    }
    
    // Stopping medications
    if ((lowerInput.includes('stop') || lowerInput.includes('quit') || lowerInput.includes('discontinue')) &&
        (lowerInput.includes('medication') || lowerInput.includes('medicine') || lowerInput.includes('pill'))) {
      return "⚠️ Never stop medications without consulting your doctor first. Stopping medications abruptly can be dangerous. Please speak with your healthcare provider.";
    }
    
    // Diagnosis requests
    if (lowerInput.includes('do i have') || lowerInput.includes('am i sick') || 
        lowerInput.includes('what disease') || lowerInput.includes('diagnose')) {
      return "⚠️ I cannot provide medical diagnoses. If you're concerned about symptoms or health conditions, please consult with a licensed healthcare professional.";
    }
    
    // Emergency situations
    if (lowerInput.includes('emergency') || lowerInput.includes('urgent') || 
        lowerInput.includes('severe pain') || lowerInput.includes('can\'t breathe')) {
      return "🚨 **EMERGENCY:** If you're experiencing a medical emergency, please call emergency services (911) immediately or go to the nearest emergency room. I cannot provide emergency medical care.";
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
      await simulateTyping(warningResponse);
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
    { text: "How do I upload a document?", icon: FileText },
    { text: "What does my blood pressure mean?", icon: Activity },
    { text: "Help with stress management", icon: Brain },
    { text: "Explain my medications", icon: Pill },
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
          className="w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:shadow-3xl transition-all duration-300 relative"
        >
          <Bot className="w-8 h-8" />
          
          {/* Pulsing animation */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 animate-ping opacity-20"></div>
        </motion.button>
        
        {/* Floating label */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute right-20 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg"
        >
          Ask Dr. AIVA
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
          className="fixed inset-0 z-50 bg-white flex flex-col"
        >
          {/* Mobile Header */}
          <div className="bg-gradient-to-r from-blue-500 to-teal-500 text-white p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Dr. AIVA</h3>
                <p className="text-sm opacity-90">AI Virtual Assistant</p>
              </div>
            </div>
            
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Close Dr. AIVA"
            >
              <X className="w-6 h-6" />
            </button>
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
                      : 'bg-gradient-to-r from-teal-400 to-blue-400 text-white'
                  }`}>
                    {message.type === 'user' ? <UserIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {message.isTyping ? (
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
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
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-600 mb-3 font-medium">Quick actions:</p>
              <div className="grid grid-cols-1 gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.text)}
                    className="flex items-center space-x-3 p-3 bg-white hover:bg-gray-50 rounded-xl text-sm transition-colors border border-gray-200"
                  >
                    <action.icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-left">{action.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mobile Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Dr. AIVA anything..."
                disabled={isTyping}
                className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base disabled:opacity-50 transition-all duration-200"
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
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
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
          className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col"
        >
          {/* Desktop Header */}
          <div className="bg-gradient-to-r from-blue-500 to-teal-500 text-white p-4 flex items-center justify-between sticky top-0 z-10 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">Dr. AIVA</h3>
                <p className="text-xs opacity-90">AI Virtual Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
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
                            : 'bg-gradient-to-r from-teal-400 to-blue-400 text-white'
                        }`}>
                          {message.type === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        
                        <div className={`rounded-2xl px-4 py-3 ${
                          message.type === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {message.isTyping ? (
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
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
                  <div className="px-4 pb-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2 pt-2">Quick actions:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickAction(action.text)}
                          className="flex items-center space-x-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs transition-colors"
                        >
                          <action.icon className="w-3 h-3 text-gray-500 flex-shrink-0" />
                          <span className="truncate text-left">{action.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Desktop Input */}
                <div className="p-4 border-t border-gray-200 bg-white/95 backdrop-blur-sm sticky bottom-0">
                  <div className="flex items-center space-x-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask Dr. AIVA anything..."
                      disabled={isTyping}
                      className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:opacity-50 transition-all duration-200"
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
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>Dr. AIVA is an AI assistant, not a licensed medical professional. For emergencies, contact a real doctor.</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ChatBot;