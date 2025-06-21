import { User, MedicalRecord } from '../../types';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

// Enhanced OpenAI API integration with medical focus
const callOpenAI = async (messages: any[], userContext: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('OpenAI API key not configured, using enhanced fallback responses');
    return generateEnhancedFallbackResponse(messages[messages.length - 1].content, userContext);
  }

  try {
    const systemPrompt = `You are Dr. AIVA, an advanced AI Virtual Medical Assistant for a medical records app called Patient Vault. You are a compassionate, knowledgeable, and professional medical AI assistant.

CORE IDENTITY:
- You are Dr. AIVA (AI Virtual Assistant)
- You specialize in medical information, mental health support, and lifestyle guidance
- You are empathetic, supportive, and always prioritize patient safety
- You communicate clearly and avoid medical jargon when possible

MEDICAL EXPERTISE AREAS:
🩺 General Medicine: Symptoms, conditions, treatments, preventive care
🧠 Mental Health: Stress, anxiety, depression, coping strategies
💊 Medications: General information about common drugs (NO dosing advice)
🏃‍♂️ Lifestyle: Nutrition, exercise, sleep hygiene, stress management
📋 Medical Records: Help users understand their health data

SAFETY PROTOCOLS:
- NEVER provide specific medical diagnoses
- NEVER recommend medication dosages or changes
- ALWAYS recommend consulting healthcare professionals for serious concerns
- Immediately provide crisis resources for suicidal ideation or emergencies
- Include appropriate disclaimers about AI limitations

COMMUNICATION STYLE:
- Use emojis appropriately to make responses friendly
- Structure responses with clear headings using **bold text**
- Provide actionable advice when appropriate
- Ask follow-up questions to better understand user needs
- Be concise but thorough

EMERGENCY RESPONSES:
For suicidal ideation: Immediately provide crisis hotline numbers (988, 911)
For medical emergencies: Direct to emergency services (911)
For urgent symptoms: Recommend immediate medical attention

USER CONTEXT:
${userContext}

Remember: You are a supportive medical AI assistant, not a replacement for professional medical care. Always encourage users to consult healthcare providers for personalized medical advice.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using the latest efficient model
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: 800,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateEnhancedFallbackResponse(messages[messages.length - 1].content, userContext);
  }
};

// Enhanced Google Gemini API integration
const callGemini = async (messages: any[], userContext: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('Gemini API key not configured, using enhanced fallback responses');
    return generateEnhancedFallbackResponse(messages[messages.length - 1].content, userContext);
  }

  try {
    const prompt = `You are Dr. AIVA, an AI Virtual Medical Assistant. You provide helpful, empathetic medical and mental health guidance while always emphasizing the importance of professional medical care.

User Context: ${userContext}

User Message: ${messages[messages.length - 1].content}

Provide a helpful, medically-informed response that:
- Addresses the user's concern with empathy
- Provides general medical/health information when appropriate
- Includes relevant disclaimers about AI limitations
- Suggests when to seek professional medical care
- Uses a warm, professional tone with appropriate emojis
- Structures information clearly with **bold headings**

Remember: You cannot diagnose, prescribe medications, or replace professional medical care.`;

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
          maxOutputTokens: 800,
          temperature: 0.7,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_MEDICAL",
            threshold: "BLOCK_NONE"
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || 'I apologize, but I couldn\'t generate a response. Please try again.';
  } catch (error) {
    console.error('Gemini API error:', error);
    return generateEnhancedFallbackResponse(messages[messages.length - 1].content, userContext);
  }
};

// Enhanced fallback response system with comprehensive medical knowledge
const generateEnhancedFallbackResponse = (userInput: string, userContext: string): string => {
  const input = userInput.toLowerCase();
  
  // Medical knowledge base for comprehensive fallback responses
  const responses = {
    greeting: [
      "Hello! I'm Dr. AIVA, your AI medical assistant. 👋\n\nI'm here to help with:\n🩺 **Medical questions**\n🧠 **Mental health support**\n💊 **Medication information**\n🏃‍♂️ **Lifestyle advice**\n\nWhat can I help you with today?",
      "Hi there! I'm Dr. AIVA, ready to assist with your health questions. 😊\n\nI can help with medical information, mental health support, and lifestyle guidance. What's on your mind?",
      "Welcome! I'm Dr. AIVA, your virtual medical assistant. 🩺\n\nI'm here to provide health information and support. How can I help you today?"
    ],
    
    stress: [
      "🧘 **Stress Management Strategies**\n\n**Immediate Relief:**\n• Deep breathing: 4-7-8 technique (inhale 4, hold 7, exhale 8)\n• Progressive muscle relaxation\n• Mindfulness meditation (even 5 minutes helps)\n\n**Long-term Strategies:**\n• Regular exercise (30 minutes daily)\n• Consistent sleep schedule (7-9 hours)\n• Limit caffeine and alcohol\n• Connect with supportive friends/family\n• Consider journaling or therapy\n\n**When to Seek Help:**\nIf stress interferes with daily life, sleep, or relationships, consider speaking with a mental health professional.\n\n💙 Remember: It's okay to ask for help. You don't have to manage stress alone."
    ],
    
    anxiety: [
      "🌟 **Anxiety Support & Coping Strategies**\n\n**Immediate Techniques:**\n• **5-4-3-2-1 Grounding:** Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste\n• **Box Breathing:** Inhale 4, hold 4, exhale 4, hold 4\n• **Cold water** on wrists or face\n\n**Daily Management:**\n• Regular exercise (reduces anxiety by 20-30%)\n• Limit caffeine (can trigger anxiety)\n• Maintain sleep hygiene\n• Practice mindfulness or meditation\n• Challenge negative thoughts\n\n**Professional Help:**\nConsider therapy if anxiety:\n• Interferes with work/relationships\n• Causes physical symptoms\n• Leads to avoidance behaviors\n\n🤗 You're not alone in this. Anxiety is treatable and manageable."
    ],
    
    depression: [
      "💙 **Depression Support & Resources**\n\n**Self-Care Strategies:**\n• **Movement:** Even 10-15 minutes of walking can help\n• **Sunlight:** Spend time outdoors daily\n• **Connection:** Reach out to one person today\n• **Routine:** Small, consistent daily activities\n• **Nutrition:** Regular meals with protein and omega-3s\n\n**Warning Signs to Watch:**\n• Persistent sadness (2+ weeks)\n• Loss of interest in activities\n• Changes in sleep/appetite\n• Feelings of hopelessness\n\n**Professional Support:**\n• Therapy (CBT, DBT are very effective)\n• Support groups\n• Medication (consult a psychiatrist)\n\n**Crisis Resources:**\n📞 **988** - National Suicide Prevention Lifeline\n💬 **Text HOME to 741741** - Crisis Text Line\n\n🌈 Recovery is possible. You matter, and help is available."
    ],
    
    bloodPressure: [
      "📊 **Blood Pressure Information**\n\n**Understanding Your Numbers:**\n• **Normal:** Less than 120/80 mmHg\n• **Elevated:** 120-129 systolic, less than 80 diastolic\n• **Stage 1 High:** 130-139/80-89 mmHg\n• **Stage 2 High:** 140/90 mmHg or higher\n• **Crisis:** Higher than 180/120 mmHg (seek immediate care)\n\n**Natural Ways to Lower BP:**\n• **DASH Diet:** Fruits, vegetables, whole grains, lean proteins\n• **Reduce sodium:** Less than 2,300mg daily (ideally 1,500mg)\n• **Regular exercise:** 30 minutes most days\n• **Maintain healthy weight**\n• **Limit alcohol:** No more than 1-2 drinks daily\n• **Manage stress:** Meditation, yoga, deep breathing\n• **Quit smoking**\n\n⚠️ **Important:** Always consult your doctor for personalized blood pressure management and medication decisions."
    ],
    
    heartRate: [
      "💓 **Heart Rate Information**\n\n**Normal Resting Heart Rate:**\n• **Adults:** 60-100 beats per minute (bpm)\n• **Athletes:** Often 40-60 bpm (more efficient heart)\n• **Factors affecting HR:** Age, fitness, medications, caffeine, stress\n\n**When to Be Concerned:**\n• **Consistently above 100 bpm** at rest (tachycardia)\n• **Below 60 bpm** with symptoms like dizziness (bradycardia)\n• **Irregular rhythm** or palpitations\n• **Chest pain** with rapid heart rate\n\n**Heart-Healthy Tips:**\n• Regular cardiovascular exercise\n• Maintain healthy weight\n• Limit caffeine and alcohol\n• Manage stress effectively\n• Don't smoke\n• Get adequate sleep\n\n🚨 **Seek immediate care** if you experience chest pain, severe shortness of breath, or fainting with heart rate changes."
    ],
    
    sleep: [
      "😴 **Sleep Hygiene & Better Rest**\n\n**Sleep Optimization:**\n• **Consistent schedule:** Same bedtime/wake time daily\n• **Cool environment:** 65-68°F (18-20°C)\n• **Dark room:** Blackout curtains or eye mask\n• **Comfortable mattress and pillows**\n\n**Pre-Sleep Routine (1-2 hours before bed):**\n• No screens (blue light disrupts melatonin)\n• Reading, gentle stretching, or meditation\n• Warm bath or shower\n• Herbal tea (chamomile, passionflower)\n\n**Avoid:**\n• Caffeine after 2 PM\n• Large meals 3 hours before bed\n• Alcohol (disrupts sleep quality)\n• Intense exercise 4 hours before bed\n\n**Sleep Disorders:**\nConsult a doctor if you experience:\n• Chronic insomnia (3+ weeks)\n• Loud snoring or breathing pauses\n• Excessive daytime sleepiness\n• Restless legs\n\n💤 Quality sleep is essential for physical and mental health."
    ],
    
    nutrition: [
      "🥗 **Nutrition & Healthy Eating**\n\n**Balanced Plate Method:**\n• **½ plate:** Non-starchy vegetables (leafy greens, broccoli, peppers)\n• **¼ plate:** Lean protein (fish, chicken, beans, tofu)\n• **¼ plate:** Complex carbs (quinoa, brown rice, sweet potato)\n• **Healthy fats:** Avocado, nuts, olive oil\n\n**Key Nutrients:**\n• **Omega-3s:** Fatty fish, walnuts, flaxseeds (brain & heart health)\n• **Fiber:** 25-35g daily (digestive health, blood sugar)\n• **Protein:** 0.8g per kg body weight (muscle maintenance)\n• **Hydration:** 8-10 glasses water daily\n\n**Foods to Limit:**\n• Processed foods high in sodium\n• Added sugars and refined carbs\n• Trans fats and excessive saturated fats\n• Excessive alcohol\n\n**Meal Timing:**\n• Eat regular meals (don't skip breakfast)\n• Stop eating 2-3 hours before bed\n• Listen to hunger/fullness cues\n\n🍎 Small, consistent changes lead to lasting health improvements."
    ],
    
    medications: [
      "💊 **Medication Information & Safety**\n\n**General Medication Guidelines:**\n• **Take as prescribed:** Don't skip doses or stop early\n• **Timing matters:** Take at consistent times\n• **Food interactions:** Some need food, others empty stomach\n• **Storage:** Follow label instructions (temperature, light)\n\n**Common Medication Classes:**\n• **Blood pressure meds:** ACE inhibitors, beta-blockers, diuretics\n• **Diabetes meds:** Metformin, insulin, SGLT2 inhibitors\n• **Cholesterol meds:** Statins, fibrates\n• **Antidepressants:** SSRIs, SNRIs, tricyclics\n\n**Important Safety:**\n• **Never share** prescription medications\n• **Check interactions** with new medications\n• **Report side effects** to your doctor\n• **Keep updated list** of all medications\n\n⚠️ **Critical:** Never stop medications without consulting your doctor. Sudden discontinuation can be dangerous.\n\n🏥 **For specific dosing questions, always consult your pharmacist or prescribing physician.**"
    ],
    
    exercise: [
      "🏃‍♂️ **Exercise & Physical Activity**\n\n**Weekly Exercise Goals:**\n• **150 minutes** moderate aerobic activity (brisk walking, swimming)\n• **75 minutes** vigorous activity (running, cycling)\n• **2+ days** strength training (all major muscle groups)\n• **Flexibility/balance** exercises (yoga, tai chi)\n\n**Starting Safely:**\n• **Begin slowly:** 10-15 minutes daily\n• **Warm up** and cool down\n• **Listen to your body:** Rest when needed\n• **Stay hydrated**\n• **Proper footwear** and equipment\n\n**Exercise Benefits:**\n• Reduces risk of heart disease, diabetes, depression\n• Improves sleep quality and energy\n• Strengthens bones and muscles\n• Enhances mental health and cognitive function\n• Helps maintain healthy weight\n\n**Medical Clearance:**\nConsult your doctor before starting if you have:\n• Heart conditions\n• Diabetes\n• High blood pressure\n• Joint problems\n• Haven't exercised in years\n\n💪 Every bit of movement counts. Start where you are!"
    ],
    
    appHelp: [
      "📱 **Patient Vault App Guide**\n\n**Key Features:**\n• **Add Records:** Click 'Add Record' to upload medical documents\n• **View Timeline:** See chronological health events\n• **Emergency Mode:** Quick access to critical health info\n• **Share Records:** Securely share with healthcare providers\n• **Prescription Upload:** Dedicated section for prescription management\n\n**Uploading Documents:**\n1. Click 'Add Record' in sidebar\n2. Fill in basic information (doctor, date, category)\n3. Add vitals if available (weight, BP, heart rate)\n4. Attach file (PDF, JPG, PNG up to 10MB)\n5. Save record\n\n**Data Security:**\n• All data encrypted and secure\n• Only you can access your records\n• HIPAA-compliant storage\n• Secure sharing with time-limited links\n\n**Tips:**\n• Regular backups of important documents\n• Keep emergency contact info updated\n• Use descriptive titles for easy searching\n\n🔒 Your health data privacy and security are our top priorities."
    ],
    
    emergency: [
      "🚨 **EMERGENCY INFORMATION**\n\n**Call 911 Immediately for:**\n• Chest pain or pressure\n• Difficulty breathing\n• Severe bleeding\n• Loss of consciousness\n• Stroke symptoms (FAST: Face drooping, Arm weakness, Speech difficulty, Time to call)\n• Severe allergic reactions\n• Poisoning\n\n**Mental Health Crisis:**\n📞 **988** - National Suicide Prevention Lifeline (24/7)\n💬 **Text HOME to 741741** - Crisis Text Line\n🌐 **suicidepreventionlifeline.org/chat** - Online chat\n\n**Poison Control:**\n📞 **1-800-222-1222** (24/7)\n\n**Emergency Preparation:**\n• Keep emergency contacts updated\n• Have medical history readily available\n• Know your allergies and medications\n• Keep insurance cards accessible\n\n⚠️ **When in doubt, seek immediate medical attention. It's better to be safe.**"
    ],
    
    default: [
      "I'm here to help with health questions and medical information! 🩺\n\n**I can assist with:**\n• Medical symptoms and conditions\n• Mental health and wellness\n• Medication information\n• Lifestyle and nutrition advice\n• Understanding your medical records\n• App navigation and features\n\nWhat specific health topic would you like to explore? Feel free to ask me anything! 😊",
      "Hello! I'm Dr. AIVA, ready to help with your health questions. 👋\n\n**Popular topics I can help with:**\n🧠 Mental health and stress management\n💓 Heart health and blood pressure\n💊 Medication information\n🏃‍♂️ Exercise and nutrition\n😴 Sleep improvement\n📱 Using the Patient Vault app\n\nWhat would you like to know more about?",
      "I'm here to provide health information and support! 🌟\n\n**Ask me about:**\n• Symptoms you're experiencing\n• Mental health and wellness strategies\n• Understanding medical test results\n• Healthy lifestyle tips\n• Managing chronic conditions\n• Preventive care recommendations\n\nWhat health topic is on your mind today? 🤔"
    ]
  };

  // Enhanced keyword matching with medical focus
  if (input.includes('hello') || input.includes('hi') || input.includes('hey') || input.includes('start')) {
    return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
  }
  
  if (input.includes('stress') || input.includes('stressed') || input.includes('overwhelmed')) {
    return responses.stress[0];
  }
  
  if (input.includes('anxiety') || input.includes('anxious') || input.includes('panic') || input.includes('worried')) {
    return responses.anxiety[0];
  }
  
  if (input.includes('depression') || input.includes('depressed') || input.includes('sad') || input.includes('hopeless')) {
    return responses.depression[0];
  }
  
  if (input.includes('blood pressure') || input.includes('bp') || input.includes('hypertension')) {
    return responses.bloodPressure[0];
  }
  
  if (input.includes('heart rate') || input.includes('pulse') || input.includes('bpm') || input.includes('heartbeat')) {
    return responses.heartRate[0];
  }
  
  if (input.includes('sleep') || input.includes('insomnia') || input.includes('tired') || input.includes('fatigue')) {
    return responses.sleep[0];
  }
  
  if (input.includes('nutrition') || input.includes('diet') || input.includes('eating') || input.includes('food')) {
    return responses.nutrition[0];
  }
  
  if (input.includes('medication') || input.includes('medicine') || input.includes('pill') || input.includes('drug')) {
    return responses.medications[0];
  }
  
  if (input.includes('exercise') || input.includes('workout') || input.includes('fitness') || input.includes('physical activity')) {
    return responses.exercise[0];
  }
  
  if (input.includes('upload') || input.includes('app') || input.includes('how to') || input.includes('navigate')) {
    return responses.appHelp[0];
  }
  
  if (input.includes('emergency') || input.includes('urgent') || input.includes('crisis')) {
    return responses.emergency[0];
  }
  
  return responses.default[Math.floor(Math.random() * responses.default.length)];
};

// Medical document analysis with enhanced insights
export const analyzeMedicalDocument = (record: MedicalRecord): string => {
  const analysis = [];
  
  analysis.push(`📋 **Medical Document Analysis: ${record.title}**\n`);
  analysis.push(`**Healthcare Provider:** ${record.doctorName}`);
  analysis.push(`**Date of Service:** ${record.visitDate}`);
  analysis.push(`**Document Category:** ${record.category.charAt(0).toUpperCase() + record.category.slice(1).replace('-', ' ')}\n`);
  
  // Enhanced category-specific analysis
  switch (record.category) {
    case 'prescription':
      analysis.push("💊 **Prescription Document Analysis:**");
      analysis.push("This document contains medication information. Key points to remember:");
      analysis.push("• Always take medications as prescribed");
      analysis.push("• Note any side effects and report to your doctor");
      analysis.push("• Don't stop medications without consulting your physician");
      analysis.push("• Keep an updated list of all medications");
      
      const title = record.title.toLowerCase();
      if (title.includes('metformin')) {
        analysis.push("\n**Metformin Information:**");
        analysis.push("• Used for type 2 diabetes management");
        analysis.push("• Take with meals to reduce stomach upset");
        analysis.push("• Monitor blood sugar levels regularly");
      }
      if (title.includes('lisinopril')) {
        analysis.push("\n**Lisinopril Information:**");
        analysis.push("• ACE inhibitor for blood pressure control");
        analysis.push("• May cause dry cough in some patients");
        analysis.push("• Monitor blood pressure regularly");
      }
      if (title.includes('atorvastatin') || title.includes('lipitor')) {
        analysis.push("\n**Statin Information:**");
        analysis.push("• Used for cholesterol management");
        analysis.push("• Take at bedtime for best effectiveness");
        analysis.push("• Report muscle pain or weakness to doctor");
      }
      break;
      
    case 'lab-results':
      analysis.push("🧪 **Laboratory Results Analysis:**");
      analysis.push("Laboratory tests provide valuable insights into your health:");
      analysis.push("• **Blood glucose:** Monitors diabetes risk and management");
      analysis.push("• **Cholesterol panel:** Assesses cardiovascular health");
      analysis.push("• **Complete blood count:** Evaluates overall health status");
      analysis.push("• **Kidney function:** Monitors organ health");
      analysis.push("• **Liver function:** Assesses metabolic health");
      analysis.push("\n**Follow-up:** Discuss results with your healthcare provider for personalized interpretation.");
      break;
      
    case 'imaging':
      analysis.push("🔬 **Medical Imaging Analysis:**");
      analysis.push("Imaging studies provide detailed views of internal structures:");
      analysis.push("• **X-rays:** Evaluate bones, chest, and detect fractures");
      analysis.push("• **MRI:** Detailed soft tissue, brain, and joint imaging");
      analysis.push("• **CT scans:** Cross-sectional body imaging for diagnosis");
      analysis.push("• **Ultrasound:** Real-time imaging of organs and blood flow");
      analysis.push("\n**Important:** Only qualified radiologists should interpret imaging results.");
      break;
      
    case 'checkup':
      analysis.push("🩺 **Medical Checkup Analysis:**");
      analysis.push("Regular checkups are essential for preventive healthcare:");
      analysis.push("• **Vital signs monitoring:** Blood pressure, heart rate, temperature");
      analysis.push("• **Physical examination:** Overall health assessment");
      analysis.push("• **Preventive screenings:** Early detection of health issues");
      analysis.push("• **Health counseling:** Lifestyle and wellness guidance");
      break;
  }
  
  // Enhanced vitals analysis with health insights
  if (record.bloodPressure || record.heartRate || record.weight || record.bloodSugar || record.height) {
    analysis.push(`\n💓 **Vital Signs Analysis:**`);
    
    if (record.bloodPressure) {
      analysis.push(`• **Blood Pressure:** ${record.bloodPressure} mmHg`);
      const [systolic, diastolic] = record.bloodPressure.split('/').map(n => parseInt(n));
      if (systolic >= 140 || diastolic >= 90) {
        analysis.push("  ⚠️ **High blood pressure** - Consult your doctor about management strategies");
        analysis.push("  💡 **Tips:** Reduce sodium, exercise regularly, manage stress");
      } else if (systolic < 90 || diastolic < 60) {
        analysis.push("  ℹ️ **Low blood pressure** - Monitor for symptoms like dizziness");
      } else {
        analysis.push("  ✅ **Normal blood pressure range** - Continue healthy lifestyle habits");
      }
    }
    
    if (record.heartRate) {
      analysis.push(`• **Heart Rate:** ${record.heartRate} bpm`);
      if (record.heartRate > 100) {
        analysis.push("  ⚠️ **Elevated heart rate** - May indicate stress, caffeine, or medical condition");
      } else if (record.heartRate < 60) {
        analysis.push("  ℹ️ **Low heart rate** - Common in athletes, monitor for symptoms");
      } else {
        analysis.push("  ✅ **Normal heart rate range** - Good cardiovascular health indicator");
      }
    }
    
    if (record.weight && record.height) {
      const bmi = record.weight / ((record.height / 100) ** 2);
      analysis.push(`• **Weight:** ${record.weight} kg | **Height:** ${record.height} cm`);
      analysis.push(`• **BMI:** ${bmi.toFixed(1)} kg/m²`);
      
      if (bmi < 18.5) {
        analysis.push("  ℹ️ **Underweight** - Consider nutritional counseling");
      } else if (bmi < 25) {
        analysis.push("  ✅ **Normal weight range** - Maintain current healthy habits");
      } else if (bmi < 30) {
        analysis.push("  ⚠️ **Overweight** - Consider lifestyle modifications");
      } else {
        analysis.push("  ⚠️ **Obese** - Consult healthcare provider for weight management plan");
      }
    } else if (record.weight) {
      analysis.push(`• **Weight:** ${record.weight} kg`);
    }
    
    if (record.bloodSugar) {
      analysis.push(`• **Blood Sugar:** ${record.bloodSugar} mg/dL`);
      if (record.bloodSugar > 126) {
        analysis.push("  ⚠️ **Elevated blood sugar** - May indicate diabetes risk");
        analysis.push("  💡 **Tips:** Monitor carbohydrate intake, increase physical activity");
      } else if (record.bloodSugar < 70) {
        analysis.push("  ⚠️ **Low blood sugar** - Monitor for hypoglycemia symptoms");
      } else {
        analysis.push("  ✅ **Normal blood sugar range** - Good metabolic health");
      }
    }
  }
  
  analysis.push("\n💡 **Health Recommendations:**");
  analysis.push("• **Keep records organized** for easy access during medical visits");
  analysis.push("• **Share with healthcare providers** for comprehensive care");
  analysis.push("• **Track trends** in your vital signs over time");
  analysis.push("• **Follow up** on any abnormal findings with your doctor");
  analysis.push("• **Maintain healthy lifestyle** habits for optimal health");
  
  analysis.push("\n🔒 **Privacy & Security:**");
  analysis.push("• Your medical data is encrypted and secure");
  analysis.push("• Only you control access to your health information");
  analysis.push("• Share responsibly with trusted healthcare providers");
  
  analysis.push("\n⚠️ **Important Disclaimer:** This analysis is for informational purposes only and does not replace professional medical interpretation. Always consult your healthcare provider for personalized medical advice and treatment decisions.");
  
  return analysis.join('\n');
};

// Main chat response generator with enhanced medical AI
export const generateChatResponse = async (
  userInput: string,
  user: User | null,
  medicalRecords: MedicalRecord[],
  currentPage: string,
  conversationHistory: Message[]
): Promise<string> => {
  
  // Build comprehensive user context
  const userContext = `
PATIENT PROFILE:
- Name: ${user ? user.name : 'Anonymous user'}
- Age: ${user?.age || 'Not specified'}
- Gender: ${user?.gender || 'Not specified'}
- Blood Type: ${user?.bloodType || 'Not specified'}
- Known Allergies: ${user?.allergies?.join(', ') || 'None listed'}

MEDICAL HISTORY:
- Total Records: ${medicalRecords.length}
- Recent Records: ${medicalRecords.slice(0, 3).map(r => `${r.title} (${r.visitDate})`).join(', ') || 'None'}
- Categories: ${[...new Set(medicalRecords.map(r => r.category))].join(', ') || 'None'}

EMERGENCY CONTACT:
- Name: ${user?.emergencyContact?.name || 'Not specified'}
- Relationship: ${user?.emergencyContact?.relationship || 'Not specified'}
- Phone: ${user?.emergencyContact?.phone || 'Not specified'}

CURRENT CONTEXT:
- App Page: ${currentPage}
- Session: Active medical consultation
  `.trim();

  // Convert conversation history to API format
  const apiMessages = conversationHistory
    .filter(msg => !msg.isTyping)
    .slice(-8) // Keep last 8 messages for context
    .map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

  // Add current user message
  apiMessages.push({
    role: 'user',
    content: userInput
  });

  // Try OpenAI first, then Gemini, then enhanced fallback
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
      console.warn('Gemini failed, using enhanced fallback...');
    }
  }

  // Use enhanced fallback system
  return generateEnhancedFallbackResponse(userInput, userContext);
};