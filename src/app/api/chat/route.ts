import { NextRequest } from 'next/server';
import PDFParser from 'pdf2json';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, mode, language, files } = body;

    const hasFiles = files && Array.isArray(files) && files.length > 0;

    if (!message && !hasFiles) {
      return new Response(JSON.stringify({ error: 'Message or file is required' }), { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    // =========================================================================
    // 1. INSTITUTIONAL GROUND TRUTH
    // =========================================================================
    let systemContext = `You are KD Campus AI, the official academic intelligence assistant for Kilachand Devchand (K.D.) Polytechnic, Patan (Gujarat).
STRICT FORMATTING & ACCURACY RULES:
- Never fabricate admission cut-offs, fee amounts, or GTU regulations.
- For checklists, multi-point steps, or document summaries, use clean standard bullet lists or numbered points. Do NOT cram paragraphs inside table cells.
- If verified numbers are unavailable, direct the student to https://kdppatan.ac.in or the administration office.
- Respond strictly in ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}.`;

    if (mode === 'admission_kd') {
      systemContext += `
VERIFIED ADMISSION GROUND-TRUTH (K.D. Polytechnic Patan):
- Institute: Kilachand Devchand Polytechnic, Patan (Government Institute under DTE Gujarat, affiliated with GTU).
- Codes: DTE Code: 622 | GTU Code: 622.
- Admission Authority: ACPDC Gujarat (acpdc.gujarat.gov.in).
- Eligibility: 10th Standard (SSC) with Mathematics, Science, and English.
- Offered Branches: Computer Engineering, Information Technology, Civil Engineering, Mechanical Engineering, Electrical Engineering.
- Fee Structure: Boys ~₹1,000-₹1,500/year. Girls: 100% Tuition Fee Exemption (Kanya Kelavani - Free tuition).
- Hostel: On-campus Boys Hostel available (~₹600/term). Girls accommodated in government social welfare hostels.`;
    } else {
      systemContext += `
VERIFIED STUDENT SERVICES GROUND-TRUTH (GTU & Gujarat Govt):
- University: Gujarat Technological University (GTU). Portals: gtu.ac.in, student.gtu.ac.in, result.gtu.ac.in.
- Progression/Detention: 100-point activity scheme; max 4 pending backlogs permitted from Sem 1 & 2 to enter Sem 5.
- Scholarships:
  1. MYSY: 80+ percentile in 10th SSC, family income <= ₹6 Lakh/year.
  2. Digital Gujarat: SC/ST/OBC/SEBC post-matric scholarship & Freeship card.
- Document Analysis Task: Thoroughly review extracted document content, verify fees, transaction IDs, enrollment numbers, subjects, student name, and dates.`;
    }

    // =========================================================================
    // 2. BUILT-IN PDF & DOCUMENT PARSER (ZERO BUILD ERRORS)
    // =========================================================================
    let extractedDocumentText = '';

    if (hasFiles) {
      for (const file of files) {
        if (file.data) {
          const buffer = Buffer.from(file.data, 'base64');
          const isPdf = file.name?.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

          if (isPdf) {
            try {
              const parsedText = await new Promise<string>((resolve) => {
                const pdfParser = new (PDFParser as any)(null, 1);
                pdfParser.on('pdfParser_dataReady', () => {
                  try {
                    const raw = (pdfParser as any).getRawTextContent();
                    resolve(decodeURIComponent(raw || ''));
                  } catch {
                    resolve('');
                  }
                });
                pdfParser.on('pdfParser_dataError', () => resolve(''));
                pdfParser.parseBuffer(buffer);
              });

              if (parsedText.trim()) {
                extractedDocumentText += `\n\n--- CONTENT OF UPLOADED DOCUMENT (${file.name}) ---\n${parsedText.trim()}\n--- END OF DOCUMENT ---\n`;
              }
            } catch (err) {
              console.warn('PDF parsing error:', err);
            }
          }
        }
      }
    }

    const userPrompt = extractedDocumentText 
      ? `${message || 'Please extract, analyze, and detail everything from this document.'}\n\n${extractedDocumentText}`
      : message;

    // =========================================================================
    // 3. API CALL HELPERS
    // =========================================================================
    const callGroqGPT = async () => {
      if (!groqKey) return null;
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
            messages: [
              { role: 'system', content: systemContext },
              { role: 'user', content: userPrompt },
            ],
            stream: true,
            temperature: 0.2,
          }),
        });
        return res.ok && res.body ? res.body : null;
      } catch (e) {
        console.warn('Groq error:', e);
        return null;
      }
    };

    const callOpenRouterOxAlpha = async () => {
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
              { role: 'user', content: userPrompt },
            ],
            stream: true,
            temperature: 0.2,
          }),
        });
        return res.ok && res.body ? res.body : null;
      } catch (e) {
        console.warn('OpenRouter error:', e);
        return null;
      }
    };

    // =========================================================================
    // 4. ROUTING LOGIC
    // =========================================================================
    let activeStream: ReadableStream<Uint8Array> | null = null;

    if (mode === 'admission_kd') {
      activeStream = await callGroqGPT();
      if (!activeStream) activeStream = await callOpenRouterOxAlpha();
    } else {
      activeStream = await callOpenRouterOxAlpha();
      if (!activeStream) activeStream = await callGroqGPT();
    }

    if (activeStream) {
      return new Response(createOpenAISSEReadableStream(activeStream), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      });
    }

    return new Response(
      JSON.stringify({ error: 'AI engine is currently unavailable. Please retry.' }),
      { status: 503 }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}

function createOpenAISSEReadableStream(rawBody: ReadableStream<Uint8Array>) {
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