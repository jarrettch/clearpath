import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { getState } from "@/lib/states";
import { buildSystemPrompt } from "@/lib/system-prompt";
import { lookupLegalAid } from "@/lib/legal-aid";

export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { messages: UIMessage[]; stateCode?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { messages, stateCode } = body;
  if (!stateCode || typeof stateCode !== "string") {
    return new Response("Missing stateCode", { status: 400 });
  }

  const state = getState(stateCode);
  if (!state) {
    return new Response(`Unknown state: ${stateCode}`, { status: 404 });
  }

  try {
    const result = streamText({
      model: anthropic("claude-sonnet-4-6"),
      system: buildSystemPrompt(state),
      messages: await convertToModelMessages(messages),
      tools: {
        lookup_legal_aid: tool({
          description:
            "Returns curated legal aid organizations for a US state plus the universal NRRC find-a-lawyer fallback. Call this after rendering a Verdict, or whenever the user asks about legal help.",
          inputSchema: z.object({
            state: z
              .string()
              .length(2)
              .describe(
                "Two-letter state code in upper case, e.g. 'CA', 'NY'. Use 'FED' for federal records.",
              ),
          }),
          execute: async ({ state }) => lookupLegalAid(state),
        }),
      },
      stopWhen: stepCountIs(3),
      onError: ({ error }) => {
        console.error("[chat] streamText error:", error);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("[chat] handler error:", err);
    return new Response("Internal error", { status: 500 });
  }
}
