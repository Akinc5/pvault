import { User, MedicalRecord } from '../../types';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

// OpenAI API integration
const callOpenAI = async (messages: any[], userContext: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('OpenAI API key not configured, using fallback responses');
    return generateFallbackResponse(messages[messages.length - 1].content, userContext);
  }

  try {
    const systemPrompt = `You are Dr. AIVA, an AI Virtual Assistant for a medical records app called Patient Vault. You are helpful, empathetic, and knowledgeable about health topics, but you always remind users that you're not a licensed medical professional.

IMPORTANT GUIDELINES:
- Always be empathetic and supportive
- Provide general health education, not specific medical advice
- Never give dosage recommendations or tell users to stop medications
- Always recommend consulting healthcare professionals for serious concerns
- Help users navigate the app and understand their medical records
- Use emojis appropriately to make responses friendly
- Keep responses concise but informative
- Always include disclaimers for medical advice

USER CONTEXT:
${userContext}

Remember: You cannot diagnose, prescribe, or provide emergency care. Always direct users to appropriate medical professionals when needed.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateFallbackResponse(messages[messages.length - 1].content, userContext);
  }
};

// Google Gemini API integration (alternative)
const callGemini = async (messages: any[], userContext: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('Gemini API key not configured, using fallback responses');
    return generateFallbackResponse(messages[messages.length - 1].content, userContext);
  }

  try {
    const prompt = `You are Dr. AIVA, an AI Virtual Assistant for a medical records app. Be helpful and empathetic, but always remind users you're not a licensed medical professional.

User Context: ${userContext}

User Message: ${messages[messages.length - 1].content}

Respond helpfully while following medical AI guidelines.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || 'I apologize, but I couldn\'t generate a response. Please try again.';
  } catch (error) {
    console.error('Gemini API error:', error);
    return generateFallbackResponse(messages[messages.length - 1].content, userContext);
  }
};

// Fallback response system (when APIs are not available)
const generateFallbackResponse = (userInput: string, userContext: string): string => {
  const input = userInput.toLowerCase();
  
  // Medical knowledge base for fallback responses
  const responses = {
    greeting: [
      "Hello! I'm Dr. AIVA, your AI health assistant. How can I help you today? 😊",
      "Hi there! I'm here to help with health questions and app navigation. What would you like to know?",
      "Welcome! I'm Dr. AIVA. I can help explain medical terms, analyze your records, and guide you through the app. How can I assist?"
    ],
    
    bloodPressure: [
      "📊 **Blood Pressure Information:**\n\nNormal blood pressure is typically around 120/80 mmHg. The first number (systolic) measures pressure when your heart beats, while the second (diastolic) measures pressure between beats.\n\n• Normal: Less than 120/80\n• Elevated: 120-129 systolic, less than 80 diastolic\n• High: 130/80 or higher\n\n⚠️ **Disclaimer:** This is general information. Please consult your doctor for personalized advice about your blood pressure readings."
    ],
    
    stress: [
      "🧘 **Stress Management Tips:**\n\n• Practice deep breathing exercises\n• Try regular physical activity\n• Maintain a consistent sleep schedule\n• Consider mindfulness or meditation\n• Talk to friends, family, or a counselor\n• Limit caffeine and alcohol\n\n💙 Remember, it's okay to ask for help. If stress becomes overwhelming, consider speaking with a mental health professional.\n\n⚠️ **Disclaimer:** This is general wellness advice, not medical treatment."
    ],
    
    navigation: [
      "🧭 **App Navigation Help:**\n\n• **Upload Documents:** Click 'Upload Medical Document' in your profile sidebar\n• **View Records:** Use the 'Records' tab to see all your medical files\n• **Timeline:** Check 'Medical Timeline' for chronological health events\n• **Emergency Access:** Red 'Emergency' button creates QR codes for first responders\n• **Share Records:** Use 'Share Records' to create secure links for doctors\n\nWhat specific feature would you like help with?"
    ],
    
    medications: [
      "💊 **Medication Information:**\n\nI can provide general information about common medications, but I cannot give dosage advice or recommend stopping medications.\n\n**Common medications I can explain:**\n• Metformin (diabetes management)\n• Lisinopril (blood pressure)\n• Atorvastatin (cholesterol)\n• Amlodipine (blood pressure)\n\nWhich medication would you like to know about?\n\n⚠️ **Important:** Always consult your doctor or pharmacist for specific medication questions."
    ],
    
    emergency: [
      "🚨 **EMERGENCY NOTICE:**\n\nIf you're experiencing a medical emergency, please:\n\n1. **Call 911 immediately** or go to the nearest emergency room\n2. **Don't wait** for online advice\n3. **Contact emergency services** for chest pain, difficulty breathing, severe injuries, or other urgent symptoms\n\nI'm an AI assistant and cannot provide emergency medical care. Your safety is the top priority! 🏥"
    ],
    
    default: [
      "I'm here to help with health questions and app navigation. Could you be more specific about what you'd like to know? 🤔",
      "I can assist with:\n• Understanding your medical records 📋\n• General health and wellness advice 💪\n• Navigating the app features 🧭\n• Explaining medical terms 📚\n\nWhat would you like to explore?",
      "I'd be happy to help! You can ask me about your health data, general wellness tips, or how to use the app features. What interests you most? 😊"
    ]
  };

  // Determine response category
  if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
    return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
  }
  
  if (input.includes('blood pressure') || input.includes('bp')) {
    return responses.bloodPressure[0];
  }
  
  if (input.includes('stress') || input.includes('anxiety') || input.includes('worried')) {
    return responses.stress[0];
  }
  
  if (input.includes('upload') || input.includes('navigate') || input.includes('how to')) {
    return responses.navigation[0];
  }
  
  if (input.includes('medication') || input.includes('medicine') || input.includes('pill')) {
    return responses.medications[0];
  }
  
  if (input.includes('emergency') || input.includes('urgent') || input.includes('help')) {
    return responses.emergency[0];
  }
  
  return responses.default[Math.floor(Math.random() * responses.default.length)];
};

// Medical document analysis
export const analyzeMedicalDocument = (record: MedicalRecord): string => {
  const analysis = [];
  
  analysis.push(`📋 **Document Analysis: ${record.title}**\n`);
  analysis.push(`**Doctor:** ${record.doctorName}`);
  analysis.push(`**Date:** ${record.visitDate}`);
  analysis.push(`**Category:** ${record.category}\n`);
  
  // Analyze based on category
  switch (record.category) {
    case 'prescription':
      analysis.push("💊 **Prescription Analysis:**");
      analysis.push("This appears to be a prescription document. Common medications and their uses:");
      
      const title = record.title.toLowerCase();
      if (title.includes('metformin')) {
        analysis.push("• Metformin: Used for type 2 diabetes management");
      }
      if (title.includes('lisinopril')) {
        analysis.push("• Lisinopril: ACE inhibitor for blood pressure control");
      }
      if (title.includes('atorvastatin') || title.includes('lipitor')) {
        analysis.push("• Statin: Used for cholesterol management");
      }
      break;
      
    case 'lab-results':
      analysis.push("🧪 **Lab Results Analysis:**");
      analysis.push("Laboratory tests help monitor your health status. Common tests include:");
      analysis.push("• Blood glucose (diabetes monitoring)");
      analysis.push("• Cholesterol levels (heart health)");
      analysis.push("• Complete blood count (overall health)");
      break;
      
    case 'imaging':
      analysis.push("🔬 **Imaging Study Analysis:**");
      analysis.push("Medical imaging provides detailed views of internal structures:");
      analysis.push("• X-rays: Bone and chest evaluation");
      analysis.push("• MRI: Detailed soft tissue imaging");
      analysis.push("• CT scans: Cross-sectional body imaging");
      break;
  }
  
  // Analyze vitals if present
  if (record.bloodPressure || record.heartRate || record.weight || record.bloodSugar) {
    analysis.push(`\n💓 **Recorded Vitals:**`);
    
    if (record.bloodPressure) {
      analysis.push(`• Blood Pressure: ${record.bloodPressure}`);
      const [systolic, diastolic] = record.bloodPressure.split('/').map(n => parseInt(n));
      if (systolic >= 140 || diastolic >= 90) {
        analysis.push("  ⚠️ This reading is in the high range - discuss with your doctor");
      } else if (systolic < 90 || diastolic < 60) {
        analysis.push("  ℹ️ This reading is in the low range");
      } else {
        analysis.push("  ✅ This reading is in the normal range");
      }
    }
    
    if (record.heartRate) {
      analysis.push(`• Heart Rate: ${record.heartRate} bpm`);
      if (record.heartRate > 100) {
        analysis.push("  ⚠️ Elevated heart rate");
      } else if (record.heartRate < 60) {
        analysis.push("  ℹ️ Low heart rate");
      } else {
        analysis.push("  ✅ Normal heart rate range");
      }
    }
    
    if (record.weight) {
      analysis.push(`• Weight: ${record.weight} kg`);
    }
    
    if (record.bloodSugar) {
      analysis.push(`• Blood Sugar: ${record.bloodSugar} mg/dL`);
      if (record.bloodSugar > 126) {
        analysis.push("  ⚠️ Elevated blood sugar - discuss with your doctor");
      } else if (record.bloodSugar < 70) {
        analysis.push("  ⚠️ Low blood sugar");
      } else {
        analysis.push("  ✅ Normal blood sugar range");
      }
    }
  }
  
  analysis.push("\n💡 **Recommendations:**");
  analysis.push("• Keep this record accessible for medical visits");
  analysis.push("• Share relevant information with healthcare providers");
  analysis.push("• Follow up with your doctor for any questions");
  analysis.push("\n⚠️ **Disclaimer:** This analysis is for informational purposes only. Always consult your healthcare provider for medical interpretation.");
  
  return analysis.join('\n');
};

// Main chat response generator
export const generateChatResponse = async (
  userInput: string,
  user: User | null,
  medicalRecords: MedicalRecord[],
  currentPage: string,
  conversationHistory: Message[]
): Promise<string> => {
  
  // Build user context
  const userContext = `
User Profile: ${user ? `${user.name}, Age: ${user.age}, Blood Type: ${user.bloodType}` : 'Anonymous user'}
Medical Records: ${medicalRecords.length} total records
Current App Page: ${currentPage}
Recent Records: ${medicalRecords.slice(0, 3).map(r => `${r.title} (${r.visitDate})`).join(', ')}
  `.trim();

  // Convert conversation history to API format
  const apiMessages = conversationHistory
    .filter(msg => !msg.isTyping)
    .slice(-10) // Keep last 10 messages for context
    .map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

  // Add current user message
  apiMessages.push({
    role: 'user',
    content: userInput
  });

  // Try OpenAI first, then Gemini, then fallback
  const openAIKey = import.meta.env.VITE_OPENAI_API_KEY;
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (openAIKey) {
    try {
      return await callOpenAI(apiMessages, userContext);
    } catch (error) {
      console.warn('OpenAI failed, trying Gemini...');
    }
  }

  if (geminiKey) {
    try {
      return await callGemini(apiMessages, userContext);
    } catch (error) {
      console.warn('Gemini failed, using fallback...');
    }
  }

  // Use fallback system
  return generateFallbackResponse(userInput, userContext);
};