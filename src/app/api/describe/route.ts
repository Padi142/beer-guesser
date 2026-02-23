import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "~/env";

const openrouter = createOpenRouter({ apiKey: env.OPENROUTER_KEY });

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { imageUrl?: string };
    if (!body.imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 },
      );
    }

    const { text } = await generateText({
      model: openrouter("google/gemini-3-flash-preview"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
        Describe this beer bottle for brand identification only. 
        Focus strictly on bottle appearance, logo style, visible text, label composition, colors, symbols, and other distinctive packaging features. 
        Do not mention taste or aroma. Keep it concise and factual.
        Do not mention any text that is written in the bottle that would indicate the brand name. 
        Focus on distinctive features like logo, colors, symbols or animals on the bottle.
        Do not output any text not related to the visual description of the bottle. Eq. Based on the image, here is...
        Do not format the text. Output plain text without markdown, lists, or extra formatting. 
        Describe the features of the bottle in grand detail. `,
            },
            {
              type: "image",
              image: new URL(body.imageUrl),
            },
          ],
        },
      ],
      maxOutputTokens: 8192,
    });

    return NextResponse.json({ description: text });
  } catch (error) {
    console.error("Failed to generate description:", error);
    return NextResponse.json(
      { error: "Failed to generate description" },
      { status: 500 },
    );
  }
}
