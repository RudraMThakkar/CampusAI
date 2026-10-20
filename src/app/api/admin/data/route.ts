import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Aap yahan apna strong password set kar sakte ho
const ADMIN_PASSWORD = process.env.ADMIN_DATA_PASSWORD || 'kdppatan@2026';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'college_data.txt');

// GET: Data fetch karne ke liye (password required)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
      return NextResponse.json({ error: 'Galat password hai!' }, { status: 401 });
    }

    if (!fs.existsSync(dataFilePath)) {
      return NextResponse.json({ content: '' });
    }

    const content = fs.readFileSync(dataFilePath, 'utf-8');
    return NextResponse.json({ content });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Naya text file me save karne ke liye
export async function POST(req: NextRequest) {
  try {
    const { password, content } = await req.json();

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password. Access denied.' }, { status: 401 });
    }

    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(dataFilePath, content, 'utf-8');
    return NextResponse.json({ success: true, message: 'Data successfully update ho gaya!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}