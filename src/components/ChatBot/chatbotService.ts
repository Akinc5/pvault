import { User, MedicalRecord } from '../../types';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

// Enhanced OpenAI API integration with retry logic and rate limit handling
const callOpenAI = async (messages: any[], userContext: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('OpenAI API key not configured, using enhanced fallback responses');
    return generateEnhancedFallbackResponse(messages[messages.length - 1].content, userContext);
  }

  // Retry logic with exponential backoff
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second base delay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
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
        const errorData = await response.json().catch(() => ({}));
        console.error(`OpenAI API Error (attempt ${attempt + 1}/${maxRetries + 1}):`, response.status, errorData);
        
        if (response.status === 401) {
          throw new Error('Invalid OpenAI API key. Please check your API key configuration.');
        } else if (response.status === 429) {
          // Rate limit error - check if we should retry
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff: 1s, 2s, 4s
            console.log(`Rate limit hit, retrying in ${delay}ms... (attempt ${attempt + 2}/${maxRetries + 1})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue; // Retry the request
          } else {
            throw new Error('RATE_LIMIT_EXCEEDED');
          }
        } else if (response.status === 500) {
          throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
        } else if (response.status >= 500) {
          // Server errors - retry if we have attempts left
          if (attempt < maxRetries) {
            const delay = baseDelay * (attempt + 1); // Linear backoff for server errors
            console.log(`Server error, retrying in ${delay}ms... (attempt ${attempt + 2}/${maxRetries + 1})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } else {
            throw new Error(`OpenAI API server error: ${response.status}`);
          }
        } else {
          throw new Error(`OpenAI API error: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from OpenAI API');
      }

      // Success - return the response
      return data.choices[0].message.content || 'I apologize, but I couldn\'t generate a response. Please try again.';

    } catch (error: any) {
      console.error(`OpenAI API error on attempt ${attempt + 1}:`, error);
      
      // If this is the last attempt or a non-retryable error, handle it
      if (attempt === maxRetries || !shouldRetryError(error)) {
        // Provide specific error messages for common issues
        if (error.message.includes('Invalid OpenAI API key')) {
          return "🔑 **API Configuration Issue**\n\nIt looks like there's an issue with the OpenAI API key configuration. Please contact support to resolve this issue.\n\nIn the meantime, I can still help with basic health questions using my built-in knowledge base!";
        } else if (error.message === 'RATE_LIMIT_EXCEEDED') {
          return "⏰ **Service Temporarily Busy**\n\nI'm experiencing high demand right now. **Please wait a few seconds and try asking your question again.**\n\nFor urgent medical concerns, please contact your healthcare provider directly.\n\n💡 **Tip:** I have extensive built-in medical knowledge and can still help with many health questions!";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          return "🌐 **Connection Issue**\n\nI'm having trouble connecting to my advanced AI services right now. Let me help you with my built-in medical knowledge instead!\n\nWhat health topic would you like to discuss?";
        } else if (error.message.includes('server error') || error.message.includes('unavailable')) {
          return "🔧 **Service Temporarily Unavailable**\n\nMy advanced AI features are temporarily unavailable, but I can still help with health questions using my comprehensive medical knowledge base.\n\nWhat would you like to know about?";
        }
        
        // Fallback to enhanced response system
        return generateEnhancedFallbackResponse(messages[messages.length - 1].content, userContext);
      }

      // If we should retry, continue to next iteration
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retrying OpenAI request in ${delay}ms... (attempt ${attempt + 2}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // This should never be reached, but just in case
  return generateEnhancedFallbackResponse(messages[messages.length - 1].content, userContext);
};

// Helper function to determine if an error should be retried
const shouldRetryError = (error: any): boolean => {
  const message = error.message?.toLowerCase() || '';
  
  // Retry on rate limits and server errors
  if (message.includes('rate_limit_exceeded') || 
      message.includes('server error') || 
      message.includes('unavailable') ||
      message.includes('timeout') ||
      message.includes('network')) {
    return true;
  }
  
  // Don't retry on authentication or client errors
  if (message.includes('invalid') || 
      message.includes('unauthorized') || 
      message.includes('forbidden')) {
    return false;
  }
  
  return false;
};

// Enhanced Google Gemini API integration with retry logic
const callGemini = async (messages: any[], userContext: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('Gemini API key not configured, using enhanced fallback responses');
    return generateEnhancedFallbackResponse(messages[messages.length - 1].content, userContext);
  }

  const maxRetries = 2; // Fewer retries for Gemini
  const baseDelay = 1000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
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
        if (response.status === 429 && attempt < maxRetries) {
          const delay = baseDelay * (attempt + 1);
          console.log(`Gemini rate limit, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0]?.content?.parts[0]?.text || 'I apologize, but I couldn\'t generate a response. Please try again.';

    } catch (error) {
      console.error(`Gemini API error on attempt ${attempt + 1}:`, error);
      if (attempt === maxRetries) {
        return generateEnhancedFallbackResponse(messages[messages.length - 1].content, userContext);
      }
    }
  }

  return generateEnhancedFallbackResponse(messages[messages.length - 1].content, userContext);
};

// Enhanced fallback response system with comprehensive medical knowledge
const generateEnhancedFallbackResponse = (userInput: string, userContext: string): string => {
  const input = userInput.toLowerCase();
  
  // Medical knowledge base for comprehensive fallback responses
  const responses = {
    greeting: [
      "Hello! I'm Dr. AIVA, your AI medical assistant. 👋\n\n**I'm here to help with:**\n🩺 Medical questions and symptoms\n🧠 Mental health support\n💊 Medication information\n🏃‍♂️ Lifestyle and wellness advice\n📋 Understanding your medical records\n\n**What can I help you with today?**",
      "Hi there! I'm Dr. AIVA, ready to assist with your health questions. 😊\n\n**I can help with:**\n• Medical information and symptoms\n• Mental health and stress management\n• Lifestyle advice for better health\n• Understanding your health data\n\n**What's on your mind?**",
      "Welcome! I'm Dr. AIVA, your virtual medical assistant. 🩺\n\n**I'm here to provide:**\n• Health information and guidance\n• Mental wellness support\n• Lifestyle recommendations\n• Medical record insights\n\n**How can I help you today?**"
    ],
    
    stress: [
      "🧘 **Stress Management Strategies**\n\n**Immediate Relief:**\n• **Deep breathing:** 4-7-8 technique (inhale 4, hold 7, exhale 8)\n• **Progressive muscle relaxation:** Tense and release muscle groups\n• **Mindfulness meditation:** Even 5 minutes helps\n• **Cold water:** Splash on face or drink slowly\n\n**Long-term Strategies:**\n• **Regular exercise:** 30 minutes daily reduces stress hormones\n• **Consistent sleep:** 7-9 hours nightly\n• **Limit caffeine:** Especially after 2 PM\n• **Social connection:** Talk to supportive friends/family\n• **Journaling:** Write down thoughts and feelings\n\n**When to Seek Help:**\nIf stress interferes with daily life, sleep, or relationships for more than 2 weeks, consider speaking with a mental health professional.\n\n💙 **Remember:** It's okay to ask for help. You don't have to manage stress alone."
    ],
    
    anxiety: [
      "🌟 **Anxiety Support & Coping Strategies**\n\n**Immediate Techniques:**\n• **5-4-3-2-1 Grounding:** Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste\n• **Box Breathing:** Inhale 4, hold 4, exhale 4, hold 4\n• **Cold water:** On wrists or face to activate vagus nerve\n• **Movement:** Even gentle stretching can help\n\n**Daily Management:**\n• **Regular exercise:** Reduces anxiety by 20-30%\n• **Limit caffeine:** Can trigger anxiety symptoms\n• **Sleep hygiene:** Consistent bedtime routine\n• **Mindfulness practice:** 10 minutes daily meditation\n• **Challenge negative thoughts:** Ask \"Is this realistic?\"\n\n**Professional Help:**\nConsider therapy if anxiety:\n• Interferes with work or relationships\n• Causes physical symptoms (racing heart, sweating)\n• Leads to avoidance behaviors\n• Persists for several weeks\n\n🤗 **You're not alone in this.** Anxiety is very treatable with the right support."
    ],
    
    depression: [
      "💙 **Depression Support & Resources**\n\n**Self-Care Strategies:**\n• **Movement:** Even 10-15 minutes of walking can boost mood\n• **Sunlight:** Spend time outdoors daily, especially morning light\n• **Connection:** Reach out to one person today\n• **Routine:** Small, consistent daily activities\n• **Nutrition:** Regular meals with protein and omega-3s\n• **Sleep:** Maintain consistent sleep schedule\n\n**Warning Signs to Watch:**\n• Persistent sadness (2+ weeks)\n• Loss of interest in activities you used to enjoy\n• Changes in sleep or appetite\n• Feelings of hopelessness or worthlessness\n• Difficulty concentrating\n\n**Professional Support:**\n• **Therapy:** CBT and DBT are very effective\n• **Support groups:** Connect with others who understand\n• **Medication:** Consult a psychiatrist if needed\n\n**Crisis Resources:**\n📞 **988** - National Suicide Prevention Lifeline\n💬 **Text HOME to 741741** - Crisis Text Line\n🌐 **suicidepreventionlifeline.org/chat** - Online chat\n\n🌈 **Recovery is possible.** You matter, and help is available."
    ],
    
    bloodPressure: [
      "📊 **Blood Pressure Information**\n\n**Understanding Your Numbers:**\n• **Normal:** Less than 120/80 mmHg\n• **Elevated:** 120-129 systolic, less than 80 diastolic\n• **Stage 1 High:** 130-139/80-89 mmHg\n• **Stage 2 High:** 140/90 mmHg or higher\n• **Crisis:** Higher than 180/120 mmHg (seek immediate care)\n\n**Natural Ways to Lower BP:**\n• **DASH Diet:** Fruits, vegetables, whole grains, lean proteins\n• **Reduce sodium:** Less than 2,300mg daily (ideally 1,500mg)\n• **Regular exercise:** 30 minutes most days\n• **Maintain healthy weight:** Even 5-10 lbs can help\n• **Limit alcohol:** No more than 1-2 drinks daily\n• **Manage stress:** Meditation, yoga, deep breathing\n• **Quit smoking:** Improves circulation immediately\n\n**Monitoring Tips:**\n• Check at same time daily\n• Rest 5 minutes before measuring\n• Use proper cuff size\n• Keep a log for your doctor\n\n⚠️ **Important:** Always consult your doctor for personalized blood pressure management and medication decisions."
    ],
    
    heartRate: [
      "💓 **Heart Rate Information**\n\n**Normal Resting Heart Rate:**\n• **Adults:** 60-100 beats per minute (bpm)\n• **Athletes:** Often 40-60 bpm (more efficient heart)\n• **Factors affecting HR:** Age, fitness, medications, caffeine, stress, temperature\n\n**When to Be Concerned:**\n• **Consistently above 100 bpm** at rest (tachycardia)\n• **Below 60 bpm** with symptoms like dizziness (bradycardia)\n• **Irregular rhythm** or palpitations\n• **Chest pain** with rapid heart rate\n• **Shortness of breath** with normal activity\n\n**Heart-Healthy Tips:**\n• **Cardiovascular exercise:** 150 minutes weekly\n• **Maintain healthy weight:** Reduces heart workload\n• **Limit caffeine:** Especially if sensitive\n• **Manage stress:** Chronic stress affects heart rhythm\n• **Don't smoke:** Damages blood vessels\n• **Get adequate sleep:** 7-9 hours nightly\n• **Stay hydrated:** Dehydration affects heart rate\n\n🚨 **Seek immediate care** if you experience chest pain, severe shortness of breath, or fainting with heart rate changes."
    ],
    
    sleep: [
      "😴 **Sleep Hygiene & Better Rest**\n\n**Sleep Optimization:**\n• **Consistent schedule:** Same bedtime/wake time daily (even weekends)\n• **Cool environment:** 65-68°F (18-20°C)\n• **Dark room:** Blackout curtains or eye mask\n• **Comfortable mattress and pillows:** Replace every 7-10 years\n• **Quiet space:** Earplugs or white noise if needed\n\n**Pre-Sleep Routine (1-2 hours before bed):**\n• **No screens:** Blue light disrupts melatonin production\n• **Reading or gentle stretching:** Calming activities\n• **Warm bath or shower:** Helps body temperature drop\n• **Herbal tea:** Chamomile, passionflower, or valerian\n• **Relaxation techniques:** Deep breathing or meditation\n\n**Avoid:**\n• **Caffeine after 2 PM:** Can stay in system 6-8 hours\n• **Large meals 3 hours before bed:** Can cause discomfort\n• **Alcohol:** Disrupts sleep quality and REM sleep\n• **Intense exercise 4 hours before bed:** Can be stimulating\n• **Daytime naps longer than 20 minutes**\n\n**Sleep Disorders:**\nConsult a doctor if you experience:\n• Chronic insomnia (3+ weeks)\n• Loud snoring or breathing pauses\n• Excessive daytime sleepiness\n• Restless legs or frequent movement\n• Waking up gasping or choking\n\n💤 **Quality sleep is essential** for physical health, mental wellbeing, and immune function."
    ],
    
    nutrition: [
      "🥗 **Nutrition & Healthy Eating**\n\n**Balanced Plate Method:**\n• **½ plate:** Non-starchy vegetables (leafy greens, broccoli, peppers, tomatoes)\n• **¼ plate:** Lean protein (fish, chicken, beans, tofu, eggs)\n• **¼ plate:** Complex carbs (quinoa, brown rice, sweet potato, whole grains)\n• **Healthy fats:** Avocado, nuts, olive oil, seeds\n\n**Key Nutrients:**\n• **Omega-3s:** Fatty fish, walnuts, flaxseeds (brain & heart health)\n• **Fiber:** 25-35g daily (digestive health, blood sugar control)\n• **Protein:** 0.8g per kg body weight (muscle maintenance)\n• **Hydration:** 8-10 glasses water daily (more if active)\n• **Vitamins & minerals:** Colorful variety of fruits and vegetables\n\n**Foods to Limit:**\n• **Processed foods:** High in sodium and preservatives\n• **Added sugars:** Limit to less than 10% of daily calories\n• **Trans fats:** Found in some fried and packaged foods\n• **Excessive saturated fats:** Limit to less than 10% of calories\n• **Excessive alcohol:** No more than 1-2 drinks daily\n\n**Meal Timing:**\n• **Don't skip breakfast:** Jumpstarts metabolism\n• **Regular meals:** Every 3-4 hours to maintain blood sugar\n• **Stop eating 2-3 hours before bed:** Aids digestion\n• **Listen to hunger/fullness cues:** Eat mindfully\n\n🍎 **Small, consistent changes** lead to lasting health improvements. Focus on progress, not perfection!"
    ],
    
    medications: [
      "💊 **Medication Information & Safety**\n\n**General Medication Guidelines:**\n• **Take as prescribed:** Don't skip doses or stop early without consulting doctor\n• **Timing matters:** Take at consistent times for best effectiveness\n• **Food interactions:** Some need food, others empty stomach - check labels\n• **Storage:** Follow label instructions (temperature, light, moisture)\n• **Expiration dates:** Don't use expired medications\n\n**Common Medication Classes:**\n• **Blood pressure meds:** ACE inhibitors, beta-blockers, diuretics\n• **Diabetes meds:** Metformin, insulin, SGLT2 inhibitors\n• **Cholesterol meds:** Statins, fibrates\n• **Antidepressants:** SSRIs, SNRIs, tricyclics\n• **Pain relievers:** NSAIDs, acetaminophen, opioids\n\n**Important Safety:**\n• **Never share** prescription medications\n• **Check interactions:** With new medications, supplements, or alcohol\n• **Report side effects:** To your doctor promptly\n• **Keep updated list:** Of all medications and dosages\n• **Use one pharmacy:** For better interaction monitoring\n\n**Medication Management:**\n• **Pill organizers:** For complex regimens\n• **Phone reminders:** For consistent timing\n• **Regular reviews:** With doctor or pharmacist\n• **Generic vs brand:** Discuss options with healthcare provider\n\n⚠️ **Critical:** Never stop medications without consulting your doctor. Sudden discontinuation can be dangerous.\n\n🏥 **For specific dosing questions, always consult your pharmacist or prescribing physician.**"
    ],
    
    exercise: [
      "🏃‍♂️ **Exercise & Physical Activity**\n\n**Weekly Exercise Goals (Adults):**\n• **150 minutes** moderate aerobic activity (brisk walking, swimming, cycling)\n• **75 minutes** vigorous activity (running, HIIT, competitive sports)\n• **2+ days** strength training (all major muscle groups)\n• **Flexibility/balance** exercises (yoga, tai chi, stretching)\n\n**Starting Safely:**\n• **Begin slowly:** 10-15 minutes daily, gradually increase\n• **Warm up** (5-10 minutes) and **cool down** (5-10 minutes)\n• **Listen to your body:** Rest when needed, don't push through pain\n• **Stay hydrated:** Before, during, and after exercise\n• **Proper footwear:** Appropriate for your activity\n• **Cross-training:** Vary activities to prevent overuse injuries\n\n**Exercise Benefits:**\n• **Cardiovascular:** Reduces risk of heart disease, stroke\n• **Metabolic:** Helps prevent/manage diabetes\n• **Mental health:** Reduces depression, anxiety, improves mood\n• **Sleep quality:** Helps you fall asleep faster, sleep deeper\n• **Bone health:** Weight-bearing exercise strengthens bones\n• **Cognitive function:** Improves memory and focus\n• **Weight management:** Burns calories, builds muscle\n\n**Medical Clearance:**\nConsult your doctor before starting if you have:\n• Heart conditions or chest pain\n• Diabetes or blood sugar issues\n• High blood pressure\n• Joint problems or arthritis\n• Haven't exercised in years\n• Any chronic health conditions\n\n💪 **Every bit of movement counts.** Start where you are, use what you have, do what you can!"
    ],
    
    appHelp: [
      "📱 **Patient Vault App Guide**\n\n**Key Features:**\n• **Add Records:** Click 'Add Record' to upload medical documents\n• **View Timeline:** See chronological health events\n• **Emergency Mode:** Quick access to critical health info\n• **Share Records:** Securely share with healthcare providers\n• **Prescription Upload:** Dedicated section for prescription management\n• **Dr. AIVA Chat:** AI medical assistant (that's me!)\n\n**Uploading Documents:**\n1. Click 'Add Record' in sidebar\n2. Fill in basic information (doctor, date, category)\n3. Add vitals if available (weight, BP, heart rate)\n4. Attach file (PDF, JPG, PNG up to 10MB)\n5. Save record\n\n**Data Security:**\n• All data encrypted and secure\n• Only you can access your records\n• HIPAA-compliant storage\n• Secure sharing with time-limited links\n\n**Tips for Best Experience:**\n• Regular backups of important documents\n• Keep emergency contact info updated\n• Use descriptive titles for easy searching\n• Include vitals data for health tracking\n• Upload prescriptions for AI analysis\n\n**Troubleshooting:**\n• **Slow loading:** Check internet connection\n• **Upload fails:** Ensure file is under 10MB\n• **Can't view file:** Try downloading instead\n• **Sync issues:** Refresh the page\n\n🔒 **Your health data privacy and security are our top priorities.**"
    ],
    
    emergency: [
      "🚨 **EMERGENCY INFORMATION**\n\n**Call 911 Immediately for:**\n• **Chest pain or pressure** lasting more than a few minutes\n• **Difficulty breathing** or shortness of breath\n• **Severe bleeding** that won't stop\n• **Loss of consciousness** or fainting\n• **Stroke symptoms:** FAST (Face drooping, Arm weakness, Speech difficulty, Time to call)\n• **Severe allergic reactions** (anaphylaxis)\n• **Poisoning** or overdose\n• **Severe burns** or trauma\n• **Suicidal thoughts** with immediate plan\n\n**Mental Health Crisis:**\n📞 **988** - National Suicide Prevention Lifeline (24/7)\n💬 **Text HOME to 741741** - Crisis Text Line\n🌐 **suicidepreventionlifeline.org/chat** - Online chat\n📞 **1-800-366-8288** - Self-Injury Outreach & Support\n\n**Poison Control:**\n📞 **1-800-222-1222** (24/7)\n🌐 **poison.org** - Online guidance\n\n**Emergency Preparation:**\n• Keep emergency contacts updated in your phone\n• Have medical history readily available\n• Know your allergies and current medications\n• Keep insurance cards accessible\n• Consider medical alert bracelet if needed\n\n**When in Doubt:**\n• **Call 911** - Emergency services\n• **Go to ER** - For serious symptoms\n• **Call your doctor** - For urgent but non-emergency issues\n• **Urgent care** - For minor injuries/illnesses\n\n⚠️ **When in doubt, seek immediate medical attention. It's better to be safe than sorry.**"
    ],
    
    default: [
      "I'm here to help with health questions and medical information! 🩺\n\n**I can assist with:**\n• **Medical symptoms and conditions**\n• **Mental health and wellness strategies**\n• **Medication information and safety**\n• **Lifestyle and nutrition advice**\n• **Understanding your medical records**\n• **App navigation and features**\n• **Emergency resources and guidance**\n\n**What specific health topic would you like to explore?** Feel free to ask me anything! 😊\n\n💡 **Tip:** I can help explain your medical records, provide health tips, or discuss any symptoms you're experiencing.",
      "Hello! I'm Dr. AIVA, ready to help with your health questions. 👋\n\n**Popular topics I can help with:**\n🧠 **Mental health** - Stress, anxiety, depression management\n💓 **Heart health** - Blood pressure, heart rate, cardiovascular tips\n💊 **Medications** - Safety, interactions, general information\n🏃‍♂️ **Exercise & nutrition** - Fitness plans, healthy eating\n😴 **Sleep improvement** - Better rest and sleep hygiene\n📱 **App features** - Using Patient Vault effectively\n\n**What would you like to know more about?**",
      "I'm here to provide health information and support! 🌟\n\n**Ask me about:**\n• **Symptoms you're experiencing** - I can provide general guidance\n• **Mental health strategies** - Stress, anxiety, mood management\n• **Understanding test results** - Help interpret your medical data\n• **Healthy lifestyle tips** - Diet, exercise, sleep, wellness\n• **Managing chronic conditions** - General care strategies\n• **Preventive care** - Screening recommendations\n• **Emergency situations** - When to seek immediate help\n\n**What health topic is on your mind today?** 🤔\n\n⚠️ **Remember:** I provide general health information, not personalized medical advice. Always consult your healthcare provider for specific medical concerns."
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
export const analyzeMedicalDocument = (record: any): string => {
  const analysis = [];
  
  analysis.push(`📋 **Medical Document Analysis: ${record.title}**\n`);
  analysis.push(`**Healthcare Provider:** ${record.doctorName || record.doctor_name || 'Unknown'}`);
  analysis.push(`**Date of Service:** ${record.visitDate || record.visit_date || 'Unknown'}`);
  analysis.push(`**Document Category:** ${(record.category || 'other').charAt(0).toUpperCase() + (record.category || 'other').slice(1).replace('-', ' ')}\n`);
  
  // Enhanced category-specific analysis
  switch (record.category) {
    case 'prescription':
      analysis.push("💊 **Prescription Document Analysis:**");
      analysis.push("This document contains medication information. Key points to remember:");
      analysis.push("• Always take medications as prescribed by your healthcare provider");
      analysis.push("• Note any side effects and report them to your doctor promptly");
      analysis.push("• Don't stop medications without consulting your physician first");
      analysis.push("• Keep an updated list of all medications and dosages");
      analysis.push("• Check for drug interactions with new medications or supplements");
      
      const title = (record.title || '').toLowerCase();
      if (title.includes('metformin')) {
        analysis.push("\n**Metformin Information:**");
        analysis.push("• Used for type 2 diabetes management");
        analysis.push("• Take with meals to reduce stomach upset");
        analysis.push("• Monitor blood sugar levels regularly");
        analysis.push("• May cause vitamin B12 deficiency with long-term use");
      }
      if (title.includes('lisinopril')) {
        analysis.push("\n**Lisinopril Information:**");
        analysis.push("• ACE inhibitor for blood pressure control");
        analysis.push("• May cause dry cough in some patients");
        analysis.push("• Monitor blood pressure regularly");
        analysis.push("• Avoid potassium supplements unless directed");
      }
      if (title.includes('atorvastatin') || title.includes('lipitor')) {
        analysis.push("\n**Statin Information:**");
        analysis.push("• Used for cholesterol management");
        analysis.push("• Take at bedtime for best effectiveness");
        analysis.push("• Report muscle pain or weakness to doctor");
        analysis.push("• Regular liver function tests may be needed");
      }
      break;
      
    case 'lab-results':
      analysis.push("🧪 **Laboratory Results Analysis:**");
      analysis.push("Laboratory tests provide valuable insights into your health:");
      analysis.push("• **Blood glucose:** Monitors diabetes risk and management");
      analysis.push("• **Cholesterol panel:** Assesses cardiovascular health");
      analysis.push("• **Complete blood count:** Evaluates overall health status");
      analysis.push("• **Kidney function:** Monitors organ health (creatinine, BUN)");
      analysis.push("• **Liver function:** Assesses metabolic health (ALT, AST)");
      analysis.push("• **Thyroid function:** Checks hormone levels (TSH, T3, T4)");
      analysis.push("\n**Follow-up:** Discuss results with your healthcare provider for personalized interpretation and next steps.");
      break;
      
    case 'imaging':
      analysis.push("🔬 **Medical Imaging Analysis:**");
      analysis.push("Imaging studies provide detailed views of internal structures:");
      analysis.push("• **X-rays:** Evaluate bones, chest, and detect fractures");
      analysis.push("• **MRI:** Detailed soft tissue, brain, and joint imaging");
      analysis.push("• **CT scans:** Cross-sectional body imaging for diagnosis");
      analysis.push("• **Ultrasound:** Real-time imaging of organs and blood flow");
      analysis.push("• **Mammography:** Breast cancer screening");
      analysis.push("• **DEXA scan:** Bone density measurement");
      analysis.push("\n**Important:** Only qualified radiologists should interpret imaging results. Always discuss findings with your healthcare provider.");
      break;
      
    case 'checkup':
      analysis.push("🩺 **Medical Checkup Analysis:**");
      analysis.push("Regular checkups are essential for preventive healthcare:");
      analysis.push("• **Vital signs monitoring:** Blood pressure, heart rate, temperature");
      analysis.push("• **Physical examination:** Overall health assessment");
      analysis.push("• **Preventive screenings:** Early detection of health issues");
      analysis.push("• **Health counseling:** Lifestyle and wellness guidance");
      analysis.push("• **Immunization updates:** Vaccine recommendations");
      analysis.push("• **Risk assessment:** Family history and lifestyle factors");
      break;
      
    default:
      analysis.push("📄 **General Medical Document:**");
      analysis.push("This document contains important health information:");
      analysis.push("• Keep this record for your medical history");
      analysis.push("• Share with healthcare providers as needed");
      analysis.push("• Follow any instructions or recommendations");
      analysis.push("• Schedule follow-up appointments if required");
      break;
  }
  
  // Enhanced vitals analysis with health insights
  if (record.bloodPressure || record.blood_pressure || record.heartRate || record.heart_rate || 
      record.weight || record.bloodSugar || record.blood_sugar || record.height) {
    analysis.push(`\n💓 **Vital Signs Analysis:**`);
    
    const bp = record.bloodPressure || record.blood_pressure;
    if (bp) {
      analysis.push(`• **Blood Pressure:** ${bp} mmHg`);
      const [systolic, diastolic] = bp.split('/').map((n: string) => parseInt(n));
      if (systolic >= 140 || diastolic >= 90) {
        analysis.push("  ⚠️ **High blood pressure** - Consult your doctor about management strategies");
        analysis.push("  💡 **Tips:** Reduce sodium, exercise regularly, manage stress, maintain healthy weight");
      } else if (systolic < 90 || diastolic < 60) {
        analysis.push("  ℹ️ **Low blood pressure** - Monitor for symptoms like dizziness or fatigue");
      } else {
        analysis.push("  ✅ **Normal blood pressure range** - Continue healthy lifestyle habits");
      }
    }
    
    const hr = record.heartRate || record.heart_rate;
    if (hr) {
      analysis.push(`• **Heart Rate:** ${hr} bpm`);
      if (hr > 100) {
        analysis.push("  ⚠️ **Elevated heart rate** - May indicate stress, caffeine, dehydration, or medical condition");
      } else if (hr < 60) {
        analysis.push("  ℹ️ **Low heart rate** - Common in athletes, monitor for symptoms like dizziness");
      } else {
        analysis.push("  ✅ **Normal heart rate range** - Good cardiovascular health indicator");
      }
    }
    
    if (record.weight && record.height) {
      const weight = record.weight;
      const height = record.height;
      const bmi = weight / ((height / 100) ** 2);
      analysis.push(`• **Weight:** ${weight} kg | **Height:** ${height} cm`);
      analysis.push(`• **BMI:** ${bmi.toFixed(1)} kg/m²`);
      
      if (bmi < 18.5) {
        analysis.push("  ℹ️ **Underweight** - Consider nutritional counseling and strength training");
      } else if (bmi < 25) {
        analysis.push("  ✅ **Normal weight range** - Maintain current healthy habits");
      } else if (bmi < 30) {
        analysis.push("  ⚠️ **Overweight** - Consider lifestyle modifications: diet and exercise");
      } else {
        analysis.push("  ⚠️ **Obese** - Consult healthcare provider for comprehensive weight management plan");
      }
    } else if (record.weight) {
      analysis.push(`• **Weight:** ${record.weight} kg`);
    }
    
    const bs = record.bloodSugar || record.blood_sugar;
    if (bs) {
      analysis.push(`• **Blood Sugar:** ${bs} mg/dL`);
      if (bs > 126) {
        analysis.push("  ⚠️ **Elevated blood sugar** - May indicate diabetes risk, discuss with doctor");
        analysis.push("  💡 **Tips:** Monitor carbohydrate intake, increase physical activity, regular monitoring");
      } else if (bs < 70) {
        analysis.push("  ⚠️ **Low blood sugar** - Monitor for hypoglycemia symptoms, discuss with doctor");
      } else {
        analysis.push("  ✅ **Normal blood sugar range** - Good metabolic health indicator");
      }
    }
  }
  
  analysis.push("\n💡 **Health Recommendations:**");
  analysis.push("• **Keep records organized** for easy access during medical visits");
  analysis.push("• **Share with healthcare providers** for comprehensive care coordination");
  analysis.push("• **Track trends** in your vital signs over time");
  analysis.push("• **Follow up** on any abnormal findings with your doctor");
  analysis.push("• **Maintain healthy lifestyle** habits for optimal health");
  analysis.push("• **Ask questions** if you don't understand any part of your results");
  
  analysis.push("\n🔒 **Privacy & Security:**");
  analysis.push("• Your medical data is encrypted and secure in Patient Vault");
  analysis.push("• Only you control access to your health information");
  analysis.push("• Share responsibly with trusted healthcare providers");
  analysis.push("• Use secure sharing features for temporary access");
  
  analysis.push("\n⚠️ **Important Disclaimer:** This analysis is for informational purposes only and does not replace professional medical interpretation. Always consult your healthcare provider for personalized medical advice, treatment decisions, and any concerns about your health.");
  
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