import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is missing in .env.local' },
        { status: 500 }
      );
    }

    const { message, mode, language } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let systemContext = 'You are CampusAI, a helpful college academic and admissions assistant.';

    if (mode === 'admission_kd') {
      systemContext = `You are the official Admission Counselor for Kilachand Devchand (K.D.) Polytechnic, Patan (Gujarat). Provide accurate details on ACPDC admissions, Computer Engineering branch, merit ranks, and campus facilities in Patan. Respond in ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}.`;
    } else if (mode === 'student_assistant') {
      systemContext = `You are the CampusAI Student Services Assistant helping with online scholarships, GTU forms, and documents. Respond in ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}.`;
    } else {
      systemContext += ` Respond in ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}.`;
    }

    // Step 1: Fetch active models list from Google
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const listData = await listRes.json();

    if (listData.error) {
      throw new Error(`API Key error: ${listData.error.message}`);
    }

    const activeModels: string[] = (listData.models || [])
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => m.name.replace('models/', ''));

    // Step 2: Prioritize recommended modern models (gemini-3.6-flash, gemini-3.5-flash)
    const priorityList = [
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.7-flash',
      'gemini-3.5-flash-lite',
      'gemini-flash-latest'
    ];

    let chosenModel = priorityList.find((m) => activeModels.includes(m));

    if (!chosenModel) {
      chosenModel = activeModels.find((m) => m.includes('flash') && !m.includes('2.5')) || activeModels[0];
    }

    console.log('Selected working model:', chosenModel);

    // Step 3: Call generation endpoint
    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${apiKey}`;

    const genRes = await fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemContext}\n\nUser Question: ${message}` }]
          }
        ]
      })
    });

    const genData = await genRes.json();

    if (genData.error) {
      throw new Error(genData.error.message);
    }

    const reply = genData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      throw new Error('Empty response from model.');
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Chat Route Final Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error processing AI response' },
      { status: 500 }
    );
  }
}