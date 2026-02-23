import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { env } from "~/env";

const pinference = createOpenAICompatible({
  name: "pinference",
  baseURL: "https://api.pinference.ai/api/v1",
  apiKey: env.PINFERENCE_API_KEY,
  headers: {
    "X-Prime-Team-ID": "cmljpmmnu000teuilp6ke3rps",
  },
});

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      description?: string;
      allowedBrands?: string[];
    };

    if (!body.description) {
      return NextResponse.json(
        { error: "description is required" },
        { status: 400 },
      );
    }

    if (!body.allowedBrands?.length) {
      return NextResponse.json(
        { error: "at least one allowed brand is required" },
        { status: 400 },
      );
    }

    const brandList = body.allowedBrands.join(", ");

    const { text } = await generateText({
      model: pinference("Qwen/Qwen3-30B-A3B-Instruct-2507:ovtsznhz12dzk34njrvose0m"),
      maxOutputTokens: 1024,
      system:
        "You are a Czech beer brand classifier. For each example, shortly reason first, then provide the final brand inside <guess>...</guess> tags.",
      messages: [
        {
          role: "user",
          content: `Identify the most likely Czech beer brand from this bottle description. Think step-by-step, then put your final answer inside <guess>...</guess>.
Description: ${body.description}
Candidate brands (choose one exact name): ${brandList}`,
        },
      ],
    });

    const guessMatch = /<guess>(.*?)<\/guess>/is.exec(text);
    const brand = guessMatch?.[1]?.trim() ?? "Unknown";

    return NextResponse.json({ brand, reasoning: text });
  } catch (error) {
    console.error("Failed to guess beer:", error);
    return NextResponse.json(
      { error: "Failed to guess beer" },
      { status: 500 },
    );
  }
}
