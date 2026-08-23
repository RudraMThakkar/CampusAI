import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, mode, language } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    let systemContext = 'You are CampusAI, an elite academic and campus assistant.';

    if (mode === 'admission_kd') {
      systemContext = `You are the official Admission Counselor for Kilachand Devchand (K.D.) Polytechnic, Patan (Gujarat).
Verified Institutional Ground-Truth (from https://kdppatan.ac.in/Computer/aboutdpt.php):
- Institute: Kilachand Devchand Polytechnic, Patan (Premier Government Institute under CTE Gujarat).
- Department: Computer Engineering (CE) Department.
- Program: 3-Year Diploma in Computer Engineering affiliated with Gujarat Technological University (GTU).
- Vision & Mission: Developing competent, industry-ready computer diploma engineers with strong ethical values, software design skills, and networking expertise.
- Laboratories & Infrastructure: Advanced Computing Labs with high-speed internet/LAN, programming environments (C, C++, Java, Python, Database Systems, Web Development), and hardware labs aligned with the GTU diploma curriculum.
- Admissions: Centralized Online Admission via ACPDC Gujarat based strictly on merit (10th standard SSC results & reservation quotas: OPEN, SEBC/OBC, SC, ST, EWS, TFW).
- Faculty & Department Portal: Recruited via State Government (GPSC/DTE) guidelines. For the current active faculty roster, circulars, and departmental updates, guide users to: https://kdppatan.ac.in/Computer/aboutdpt.php.
- Rules: Never generate placeholder names (e.g. "Lecturer 1"). Provide accurate, well-structured, supportive guidance. Respond in ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}.`;
    } else if (mode === 'student_assistant') {
      systemContext = `You are the CampusAI Student Services Assistant helping with scholarships (Digital Gujarat portal), GTU exam forms, re-checking processes, and student documents. Respond in ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}.`;
    } else {
      systemContext += ` Provide clean, well-formatted Markdown with syntax-highlighted code where needed. Respond in ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}.`;
    }

    let useOpenRouter = false;
    let selectedModelBadge = 'Google Gemini 3.6 Flash';

    if (mode === 'auto') {
      const q = message.toLowerCase();
      const isCoding = ['code', 'python', 'c++', 'java', 'algorithm', 'function', 'bug', 'sql', 'script', 'programming', 'loop', 'array'].some((keyword) => q.includes(keyword));

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

    // Branch 1: OpenRouter
    if (useOpenRouter) {
      if (!openrouterKey) {
        throw new Error('OPENROUTER_API_KEY is missing in .env.local');
      }

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
      if (data.error) {
        throw new Error(`OpenRouter Error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      const reply = data.choices?.[0]?.message?.content;
      if (!reply) throw new Error('Empty response received from OpenRouter model.');

      return NextResponse.json({ reply, usedModel: selectedModelBadge });
    }

    // Branch 2: Google Gemini
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY is missing in .env.local');
    }

    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`;

    const genRes = await fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    if (genData.error) {
      throw new Error(`Gemini Error: ${genData.error.message}`);
    }

    const reply = genData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) throw new Error('Empty response from Gemini API.');

    return NextResponse.json({ reply, usedModel: selectedModelBadge });

  } catch (error: any) {
    console.error('Unified Chat Route Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error processing request' },
      { status: 500 }
    );
  }
}