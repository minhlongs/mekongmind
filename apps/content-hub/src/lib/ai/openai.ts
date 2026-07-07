import OpenAI from "openai";

let openai: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "sk-placeholder" });
  }
  return openai;
}

export async function enrichContent(title: string, originalContent: string): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a marketing content editor. Rewrite the given content to be more engaging, structured, and professional. Keep the core message but improve clarity, add compelling hooks, and optimize for readability. Output ONLY the improved content in Vietnamese."
      },
      {
        role: "user",
        content: `Title: ${title}\n\nOriginal Content:\n${originalContent}`
      }
    ],
    max_tokens: 2000,
    temperature: 0.7
  });
  return response.choices[0].message.content ?? originalContent;
}

export async function generateTags(title: string, aiContent: string): Promise<string[]> {
  const response = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a content tagger. Analyze the given content and generate 3-7 relevant tags in Vietnamese. Return ONLY a JSON array of strings, no other text. Example: [\"marketing\", \"sản phẩm\", \"khuyến mãi\"]"
      },
      {
        role: "user",
        content: `Title: ${title}\n\nContent:\n${aiContent}`
      }
    ],
    max_tokens: 100,
    temperature: 0.3
  });
  try {
    const text = response.choices[0].message.content ?? "[]";
    return JSON.parse(text);
  } catch {
    return [];
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getClient().embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });
  return response.data[0].embedding;
}
