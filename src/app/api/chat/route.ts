import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import PDFParser from 'pdf2json';

function getLocalCollegeKnowledge(): string {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'college_data.txt');
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (err) {
    console.warn('Could not read college_data.txt:', err);
  }
  return '';
}

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

    const collegeKnowledge = getLocalCollegeKnowledge();

    // =========================================================================
    // DUAL-DESK ROLE PROMPT DEFINITION
    // =========================================================================
    let systemContext = '';

    if (mode === 'student_assistant') {
      systemContext = `You are the AI Student Assistant for Kilachand Devchand (K.D.) Polytechnic, Patan.

STRICT OPERATIONAL BOUNDARIES & RESTRICTIONS:
1. PERMITTED TOPICS ONLY:
   - How to check GTU exam results (guide them to result.gtu.ac.in).
   - How to search diploma subjects, syllabus, course codes, and curriculum.
   - Academic coding assistance (C, C++, Java, Python, Web Dev, DSA, SQL).
   - Academic engineering mathematics and calculations.
   - Uploaded student receipt/document analysis.

2. STRICT PROHIBITED TOPICS:
   - DO NOT answer questions regarding Admissions, ACPDC merit ranks, admission cut-offs.
   - DO NOT answer questions regarding Scholarships (MYSY, Digital Gujarat), college admission fees, or hostel admission fees.

3. REFUSAL PROTOCOL FOR PROHIBITED TOPICS:
   If the student asks about admission, eligibility, scholarships, or college fees in this mode, DO NOT answer. Respond strictly with:
   "I am the Student Assistant for academic doubts, coding, calculations, and GTU results/syllabus guidance. For admissions, fees, hostel, or scholarships, please switch to the 'KD Admission Desk' tab above or contact the administration office at K.D. Polytechnic, Patan."

4. Strictly avoid raw HTML tags like <br>. Use clean markdown.
5. Target Language: ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}.`;
    } else {
      // Admission Desk Mode
      systemContext = `You are the Official KD Admission Desk for Kilachand Devchand (K.D.) Polytechnic, Patan.

CRITICAL INSTRUCTIONS & STRICT BOUNDARIES:
1. YOU ARE A STRICT CLOSED-DOMAIN AGENT. You must ONLY answer questions based on:
   - The verified College Knowledge Base provided below.
   - The official college website: https://kdppatan.ac.in.
   - Uploaded receipts/documents if provided.
2. ABSOLUTELY DO NOT answer general out-of-scope world knowledge or unrelated queries.
3. If the information is not in the official college records or website, answer with:
   "This data is not available in our official college records. Please contact the respective college administration office at K.D. Polytechnic, Patan (Website: https://kdppatan.ac.in)."
4. Strictly avoid raw HTML tags like <br>. Use clean markdown.
5. Target Language: ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}.

=============================================================================
AUTHORIZED COLLEGE KNOWLEDGE BASE:
=============================================================================
${collegeKnowledge || `
- Institute: Kilachand Devchand Polytechnic, Patan.
- Codes: DTE Code: 631 | GTU Code: 631.
- Official Website: https://kdppatan.ac.in
- Offered Branches (Only 4): Computer Engineering, Civil Engineering, Mechanical Engineering, Electrical Engineering.
- Note: Information Technology (IT) branch is NOT available at K.D. Polytechnic Patan.
- Fees: Boys ~₹1,000-₹1,500/year. Girls: 100% Tuition Fee Exemption (Kanya Kelavani).
- Hostel: Boys on-campus (~₹600/term). Girls: Government Social Welfare hostel.
- Admission: Through ACPDC Gujarat (acpdc.gujarat.gov.in) based on 10th SSC.
- Scholarships: MYSY (80+ percentile, <= 6 Lakh income) & Digital Gujarat.
`}
=============================================================================`;
    }

    // =========================================================================
    // BUILT-IN PDF PARSER
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
      ? `${message || 'Please extract and analyze details from this document.'}\n\n${extractedDocumentText}`
      : message;

    // API Call Helpers
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
            temperature: mode === 'student_assistant' ? 0.2 : 0.0,
          }),
        });
        return res.ok && res.body ? res.body : null;
      } catch (e) {
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
            temperature: mode === 'student_assistant' ? 0.2 : 0.0,
          }),
        });
        return res.ok && res.body ? res.body : null;
      } catch (e) {
        return null;
      }
    };

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