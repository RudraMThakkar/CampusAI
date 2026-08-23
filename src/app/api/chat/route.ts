import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, mode, language } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    let systemContext = 'You are CampusAI, an elite academic and campus assistant.';

    if (mode === 'admission_kd') {
      systemContext = `You are the official Admission Counselor for Kilachand Devchand (K.D.) Polytechnic, Patan (Gujarat).
Verified Ground-Truth (https://kdppatan.ac.in/Computer/aboutdpt.php):
- Institute: Kilachand Devchand Polytechnic, Patan (Government Institute under CTE Gujarat).
- Department: Computer Engineering (CE).
- Program: 3-Year Diploma in Computer Engineering affiliated with GTU.
- Admission: Centralized Online Admission via ACPDC Gujarat (Merit & Reservation: OPEN, SEBC, SC, ST, EWS, TFW).
- DDCET: Diploma to Degree Common Entrance Test for direct 2nd-year degree engineering admission after diploma.
- Facilities: Advanced Computing Labs, High-Speed Internet/LAN, GTU-aligned syllabus.
Respond in ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}.`;
    } else if (mode === 'student_assistant') {
      systemContext = `You are the CampusAI Student Services Assistant helping with scholarships (Digital Gujarat), GTU exam forms, latest declared results info, and DDCET guidance. Guide students to check results on result.gtu.ac.in. Respond in ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}.`;
    } else {
      systemContext += ` Provide structured, well-formatted Markdown responses. Language: ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}.`;
    }

    let useOpenRouter = false;
    let selectedModelBadge = 'Google Gemini 3.6 Flash';

    if (mode === 'auto') {
      const q = message.toLowerCase();
      const isCoding = ['code', 'python', 'c++', 'java', 'algorithm', 'function', 'bug', 'sql', 'script', 'programming', 'loop', 'array'].some((k) => q.includes(k));
      if (isCoding) {
        useOpenRouter = true;
        selectedModelBadge = 'OX Alpha (Auto Code Engine)';
      } else {
        useOpenRouter = false;
        selectedModelBadge = 'Gemini 3.6 Flash (Auto Campus Engine)';
      }
    } else if (mode === 'deepseek' || mode === 'grok' || mode === 'nemotron') {
      useOpenRouter = true;
      selectedModelBadge = 'OpenRouter (OX Alpha)';
    } else {
      useOpenRouter = false;
      selectedModelBadge = mode === 'admission_kd' ? 'KD Admission Desk' : mode === 'student_assistant' ? 'Student Assistant' : 'Google Gemini 3.6 Flash';
    }

    // Helper function for OpenRouter dispatch
    const queryOpenRouter = async () => {
      if (!openrouterKey) return null;
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'CampusAI',
        },
        body: JSON.stringify({
          model: 'stealth/ox-alpha',
          messages: [
            { role: 'system', content: systemContext },
            { role: 'user', content: message },
          ],
        }),
      });

      const data = await res.json();
      return data.choices?.[0]?.message?.content || null;
    };

    // Primary OpenRouter route for code
    if (useOpenRouter) {
      const reply = await queryOpenRouter();
      if (reply) {
        return NextResponse.json({ reply, usedModel: selectedModelBadge });
      }
    }

    // Primary Gemini 3.6 Flash with dynamic fallback on quota limits
    if (geminiKey) {
      try {
        const generateUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent';
        
        const genRes = await fetch(generateUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiKey
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemContext}\n\nUser Question: ${message}` }],
              },
            ],
          }),
        });

        const genData = await genRes.json();

        // Check if quota limit or rate limit occurred
        if (genData.error) {
          console.warn('Gemini quota/error encountered. Switching to backup router...');
          const fallbackReply = await queryOpenRouter();
          if (fallbackReply) {
            return NextResponse.json({
              reply: fallbackReply,
              usedModel: `${selectedModelBadge} (Backup Router)`
            });
          }
          return NextResponse.json({ error: `Gemini: ${genData.error.message}` }, { status: 500 });
        }

        const reply = genData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          return NextResponse.json({ reply, usedModel: selectedModelBadge });
        }
      } catch (geminiErr) {
        console.warn('Gemini request failed, trying fallback...', geminiErr);
        const fallbackReply = await queryOpenRouter();
        if (fallbackReply) {
          return NextResponse.json({
            reply: fallbackReply,
            usedModel: `${selectedModelBadge} (Backup Router)`
          });
        }
      }
    }

    // Final Fallback Attempt
    const fallbackReply = await queryOpenRouter();
    if (fallbackReply) {
      return NextResponse.json({
        reply: fallbackReply,
        usedModel: 'OpenRouter (OX Alpha Backup)'
      });
    }

    return NextResponse.json({ error: 'All AI services are currently busy. Please try again.' }, { status: 500 });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}