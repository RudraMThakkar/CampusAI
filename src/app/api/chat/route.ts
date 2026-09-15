import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, mode, language, files } = body;

    if (!message && (!files || files.length === 0)) {
      return NextResponse.json({ error: 'Message or file is required' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    let systemContext = 'You are KD Campus AI, the official academic intelligence assistant for Kilachand Devchand (K.D.) Polytechnic, Patan.';

    if (mode === 'admission_kd') {
      systemContext = `You are the official Admission Counselor for Kilachand Devchand (K.D.) Polytechnic, Patan (Gujarat).
Verified Ground-Truth (https://kdppatan.ac.in):
- Institute: Kilachand Devchand Polytechnic, Patan (Government Institute under CTE Gujarat, affiliated with GTU).
- Admission: Centralized Online Admission via ACPDC Gujarat (Merit & Reservation: OPEN, SEBC, SC, ST, EWS, TFW).
- Programs: 3-Year Diploma Engineering in Computer, IT, Civil, Mechanical, and Electrical.
- Fees: Government nominal fee (~₹1000/year for boys, free for girls under government schemes).
- DDCET: Diploma to Degree Common Entrance Test for direct 2nd-year engineering admission after diploma.
- Facilities: Advanced Computing Labs, High-Speed Internet/LAN, Boys Hostel on campus, GTU-aligned syllabus.
When an image or document is attached (e.g. marksheet, merit receipt), extract key details like marks, percentages, seat numbers, or eligibility.
Respond in ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}.`;
    } else if (mode === 'student_assistant') {
      systemContext = `You are the KD Campus AI Student Services Assistant helping with scholarships (Digital Gujarat MYSY, Freeship card for SC/ST/SEBC), GTU exam forms, latest circulars, semester syllabus, and results (result.gtu.ac.in).
When an image or document is attached (e.g. hall ticket, circular, grade card), analyze and explain the academic instructions clearly.
Respond in ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}.`;
    } else {
      systemContext += ` Provide structured, well-formatted Markdown responses. Language: ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}.`;
    }

    const selectedModelBadge = mode === 'admission_kd' ? 'KD Admission Desk' : 'Student Assistant Desk';

    // Helper function for OpenRouter fallback
    const queryOpenRouter = async () => {
      if (!openrouterKey) return null;
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openrouterKey}`,
            'HTTP-Referer': 'https://campusai-cnlf.onrender.com',
            'X-Title': 'KD Campus AI',
          },
          body: JSON.stringify({
            model: 'stealth/ox-alpha',
            messages: [
              { role: 'system', content: systemContext },
              { role: 'user', content: message || 'Please analyze this inquiry.' },
            ],
          }),
        });

        const data = await res.json();
        return data.choices?.[0]?.message?.content || null;
      } catch {
        return null;
      }
    };

    // 1. Primary Engine: Gemini 3.6 Flash (Official latest model)
    if (geminiKey) {
      try {
        const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`;

        const parts: any[] = [];
        parts.push({ text: `${systemContext}\n\nUser Question: ${message || 'Please analyze the attached document or image.'}` });

        if (files && Array.isArray(files) && files.length > 0) {
          for (const file of files) {
            if (file.data && file.type) {
              parts.push({
                inline_data: {
                  mime_type: file.type,
                  data: file.data,
                },
              });
            }
          }
        }

        const genRes = await fetch(generateUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts }],
          }),
        });

        const genData = await genRes.json();

        if (genData.error) {
          console.warn('Gemini error/quota, switching to backup...', genData.error);
          const fallbackReply = await queryOpenRouter();
          if (fallbackReply) {
            return NextResponse.json({
              reply: fallbackReply,
              usedModel: `${selectedModelBadge} (Backup Router)`
            });
          }
          return NextResponse.json({ error: `AI Engine: ${genData.error.message}` }, { status: 500 });
        }

        const reply = genData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          return NextResponse.json({ reply, usedModel: selectedModelBadge });
        }
      } catch (geminiErr) {
        console.warn('Gemini call failed, trying backup...', geminiErr);
        const fallbackReply = await queryOpenRouter();
        if (fallbackReply) {
          return NextResponse.json({
            reply: fallbackReply,
            usedModel: `${selectedModelBadge} (Backup Router)`
          });
        }
      }
    }

    // 2. Final Fallback Attempt
    const fallbackReply = await queryOpenRouter();
    if (fallbackReply) {
      return NextResponse.json({
        reply: fallbackReply,
        usedModel: `${selectedModelBadge} (Backup Engine)`
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