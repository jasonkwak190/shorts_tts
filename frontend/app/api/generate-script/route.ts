import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { topic, style = 'engaging' } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const prompt = `
Create an engaging YouTube Shorts script about "${topic}".

Requirements:
- Duration: 30-60 seconds when spoken
- Style: ${style}, attention-grabbing
- Structure: Hook + Main content + Call to action
- Language: Korean
- Format: Natural speaking style for TTS

The script should be:
- Conversational and easy to understand
- Suitable for short-form video content
- Include emotional hooks to keep viewers engaged
- End with a strong call to action

Topic: ${topic}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional YouTube Shorts scriptwriter. Create scripts that are engaging, concise, and perfect for TTS generation."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const script = completion.choices[0]?.message?.content || '';

    return NextResponse.json({
      script,
      topic,
      wordCount: script.split(' ').length
    });

  } catch (error: any) {
    console.error('OpenAI API error:', error);
    
    if (error?.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'OpenAI API quota exceeded' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate script' },
      { status: 500 }
    );
  }
}