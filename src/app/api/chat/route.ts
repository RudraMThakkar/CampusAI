import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, mode, language, files } = body;

    if (!message && (!files || files.length === 0)) {
      return new Response(JSON.stringify({ error: 'Message or file is required' }), { status: 400 });
    }

    const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
    const geminiKeys = rawKeys.split(',').map((k) => k.trim()).filter(Boolean);

    if (geminiKeys.length === 0) {
      return new Response(JSON.stringify({ error: 'No Gemini API keys found.' }), { status: 500 });
    }

    let systemContext = 'You are KD Campus AI, the official academic intelligence assistant for Kilachand Devchand (K.D.) Polytechnic, Patan.';

    if (mode === 'admission_kd') {
      systemContext = `You are the official Admission Counselor for Kilachand Devchand (K.D.) Polytechnic, Patan (Gujarat).
Verified Ground-Truth (https://kdppatan.ac.in):
- Institute: Kilachand Devchand Polytechnic, Patan (Government Institute under CTE Gujarat, affiliated with GTU).
- Admission: Centralized Online Admission via ACPDC Gujarat (Merit & Reservation: OPEN, SEBC, SC, ST, EWS, TFW).
- Programs: 3-Year Diploma Engineering in Computer, IT, Civil, Mechanical, and Electrical.
- Fees: Government nominal fee (~₹1000/year for boys, free for girls under government schemes).
- Facilities: Advanced Computing Labs, High-Speed Internet/LAN, Boys Hostel on campus, GTU-aligned syllabus.
When analyzing documents/marksheets, summarize key details (marks, seat no, verification status) accurately.
Respond in ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}.`;
    } else {
      systemContext = `You are the KD Campus AI Student Services Assistant helping with scholarships (Digital Gujarat MYSY, Freeship card for SC/ST/SEBC), GTU exam forms, syllabus, and results (result.gtu.ac.in).
When an image or document is attached, read and explain the academic details clearly.
Respond in ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}.`;
    }

    const parts: any[] = [];
    parts.push({ text: `${systemContext}\n\nUser Question: ${message || 'Please analyze this attached document/image thoroughly.'}` });

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

    for (const key of geminiKeys) {
      try {
        const streamUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:streamGenerateContent?alt=sse&key=${key}`;

        const geminiRes = await fetch(streamUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts }],
          }),
        });

        if (!geminiRes.ok || !geminiRes.body) {
          continue;
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        const transformStream = new ReadableStream({
          async start(controller) {
            const reader = geminiRes.body!.getReader();
            let buffer = '';

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (trimmed.startsWith('data: ')) {
                    const jsonStr = trimmed.replace('data: ', '').trim();
                    try {
                      const parsed = JSON.parse(jsonStr);
                      const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                      if (text) {
                        controller.enqueue(encoder.encode(text));
                      }
                    } catch {
                      // Skip invalid chunks
                    }
                  }
                }
              }
            } catch (err) {
              controller.error(err);
            } finally {
              controller.close();
            }
          },
        });

        return new Response(transformStream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
          },
        });
      } catch (err) {
        console.warn(`Key ...${key.slice(-4)} stream error. Rotating...`);
      }
    }

    return new Response(JSON.stringify({ error: 'All AI models are currently busy. Please retry.' }), { status: 503 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}