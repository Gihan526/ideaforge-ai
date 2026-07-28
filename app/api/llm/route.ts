import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: "https://api.mistral.ai/v1",
});

export async function GET() {
  try {
    const response = await client.chat.completions.create({
      model: process.env.MISTRAL_MODEL ?? "open-mistral-nemo",
      messages: [
        {
          role: "user",
          content: "Hello!",
        },
      ],
    });

    return NextResponse.json({
      ok: true,
      content: response.choices[0]?.message?.content ?? "",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}