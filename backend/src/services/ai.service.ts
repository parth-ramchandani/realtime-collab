import OpenAI from "openai";
import { env } from "../utils/env";

const openai = env.openAiApiKey ? new OpenAI({ apiKey: env.openAiApiKey }) : null;

export class AiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiConfigurationError";
  }
}

export class AiService {
  private static getClient(): OpenAI {
    if (!openai) {
      throw new AiConfigurationError("OPENAI_API_KEY is missing on the backend.");
    }
    return openai;
  }

  static async summarizeSession(editorContent: string, messages: string[]): Promise<string> {
    const client = this.getClient();

    const completion = await client.responses.create({
      model: env.openAiModel,
      input: [
        {
          role: "system",
          content: "You summarize collaboration sessions in under 80 words."
        },
        {
          role: "user",
          content: `Editor content:\n${editorContent}\n\nRecent messages:\n${messages.join("\n")}`
        }
      ]
    });

    if (!completion.output_text) {
      throw new Error("OpenAI did not return summary text.");
    }
    return completion.output_text;
  }

  static async suggestNextSentence(editorContent: string): Promise<string> {
    const client = this.getClient();

    const completion = await client.responses.create({
      model: env.openAiModel,
      input: [
        {
          role: "system",
          content: "Suggest one natural next sentence for a shared document. Return only one sentence."
        },
        {
          role: "user",
          content: `Continue this writing naturally:\n${editorContent}`
        }
      ]
    });

    if (!completion.output_text) {
      throw new Error("OpenAI did not return suggestion text.");
    }
    return completion.output_text;
  }
}
