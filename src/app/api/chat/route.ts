import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, mode, language, files } = body;

    const hasFiles = files && Array.isArray(files) && files.length > 0;

    if (!message && !hasFiles) {
      return new Response(JSON.stringify({ error: 'Message or file is required' }), { status: 400 });
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    // =========================================================================
    // 0. EXPLICIT IMAGE GENERATION INTERCEPTOR
    // =========================================================================
    const isImageRequest = /(create|generate|make|draw|show)\s+(an?\s+)?(image|picture|photo|diagram|illustration)/i.test(message || '');

    if (isImageRequest && !hasFiles) {
      const cleanPrompt = encodeURIComponent(
        (message || '')
          .replace(/(create|generate|make|draw|show)\s+(an?\s+)?(image|picture|photo|diagram|illustration)\s+(of|explaining|showing)?/gi, '')
          .trim() || 'academic diagram'
      );

      const imageUrl = `https://image.pollinations.ai/prompt/detailed%20infographic%20diagram%20of%20${cleanPrompt}%20clean%20educational%20high%20resolution?width=1024&height=600&nologo=true&seed=${Math.floor(Math.random() * 10000)}`;

      const responseMarkdown = `![Generated Diagram](${imageUrl})\n\n### Explanation for ${decodeURIComponent(cleanPrompt)}:\nHere is the visual diagram generated for your request. Dynamic memory allocation allows programs to allocate memory explicitly at runtime from the **Heap** using functions like \`malloc()\`, \`calloc()\`, and release it back to the system using \`free()\`.`;

      return new Response(responseMarkdown, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
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
When an image or document is attached (e.g. marksheet, fee receipt, merit slip), thoroughly read and extract numbers, transaction IDs, payment status, dates, and names.
Respond in ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}. Provide clear, structured bullet points.`;
    } else {
      systemContext = `You are the KD Campus AI Student Services Assistant helping with scholarships (Digital Gujarat MYSY, Freeship card for SC/ST/SEBC), GTU exam forms, latest circulars, semester syllabus, and results (result.gtu.ac.in).
When an image or document is attached (e.g. MOOC receipt, fee voucher, hall ticket, marksheet), read every field like course name, student details, amount paid, and verification status.
Respond in ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}. Provide clear, structured bullet points.`;
    }

    // =========================================================================
    // 1. ROUTE 1: PURE TEXT QUERIES -> GROQ (qwen/qwen3.8-27b)
    // =========================================================================
    if (!hasFiles && groqKey) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: 'qwen/qwen3.8-27b',
            messages: [
              { role: 'system', content: systemContext },
              { role: 'user', content: message },
            ],
            stream: true,
            temperature: 0.3,
          }),
        });

        if (groqRes.ok && groqRes.body) {
          return new Response(createSSEReadableStream(groqRes.body), {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Transfer-Encoding': 'chunked',
            },
          });
        }
      } catch (err) {
        console.warn('Groq text call failed:', err);
      }
    }

    // =========================================================================
    // 2. ROUTE 2: OCR / ATTACHMENTS & BACKUP -> OPENROUTER
    // =========================================================================
    if (openrouterKey) {
      try {
        let userContent: any = message || 'Please analyze this attached document/receipt thoroughly.';

        if (hasFiles) {
          const parts: any[] = [{ type: 'text', text: userContent }];
          for (const file of files) {
            if (file.data && file.type) {
              parts.push({
                type: 'image_url',
                image_url: {
                  url: `data:${file.type};base64,${file.data}`,
                },
              });
            }
          }
          userContent = parts;
        }

        const modelToUse = hasFiles ? 'google/gemini-2.0-flash-001' : 'stealth/ox-alpha';

        const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openrouterKey}`,
            'HTTP-Referer': 'https://campusai-cnlf.onrender.com',
            'X-Title': 'KD Campus AI',
          },
          body: JSON.stringify({
            model: modelToUse,
            messages: [
              { role: 'system', content: systemContext },
              { role: 'user', content: userContent },
            ],
            stream: true,
          }),
        });

        if (orRes.ok && orRes.body) {
          return new Response(createSSEReadableStream(orRes.body), {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Transfer-Encoding': 'chunked',
            },
          });
        }
      } catch (orErr) {
        console.error('OpenRouter call failed:', orErr);
      }
    }

    return new Response(
      JSON.stringify({ error: 'AI engine is currently unavailable. Please retry.' }),
      { status: 503 }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}

function createSSEReadableStream(rawBody: ReadableStream<Uint8Array>) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      const reader = rawBody.getReader();
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
            if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
              const jsonStr = trimmed.replace('data: ', '').trim();
              try {
                const parsed = JSON.parse(jsonStr);
                const token = parsed.choices?.[0]?.delta?.content;
                if (token) {
                  controller.enqueue(encoder.encode(token));
                }
              } catch {
                // ignore
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
}