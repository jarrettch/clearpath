"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Streamdown } from "streamdown";
import { ResourceCard } from "@/components/ResourceCard";
import type { LegalAidLookupResult } from "@/lib/legal-aid";
import type { StateEntry } from "@/lib/states";

const FIRST_TURN_PROMPT =
  "To get started, I have a few quick questions. First — was your case a conviction, or did it end in a dismissal or other non-conviction outcome?";

export function StateChat({ state }: { state: StateEntry }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { stateCode: state.code },
    }),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    sendMessage({ text });
    setInput("");
  };

  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <div className="flex flex-col h-[70vh] min-h-[500px] rounded-lg border border-zinc-200 bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="rounded-md bg-zinc-50 border border-zinc-200 p-4 text-sm text-zinc-700">
            <p className="font-medium text-zinc-900 mb-1">
              {state.name}
            </p>
            <p>{FIRST_TURN_PROMPT}</p>
            <p className="text-xs text-zinc-500 mt-3 italic">
              Starting point, not legal advice. ClearPath does not store your
              answers.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "flex justify-end"
                : "flex flex-col items-start"
            }
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm"
                  : "max-w-full w-full rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-sm text-zinc-900"
              }
            >
              {m.parts.map((part, idx) => {
                if (part.type === "text") {
                  return (
                    <Streamdown
                      key={idx}
                      className="prose prose-sm max-w-none prose-zinc"
                    >
                      {part.text}
                    </Streamdown>
                  );
                }
                if (part.type === "tool-lookup_legal_aid") {
                  if (part.state === "output-available") {
                    return (
                      <ResourceCard
                        key={idx}
                        result={part.output as LegalAidLookupResult}
                      />
                    );
                  }
                  if (part.state === "input-streaming" || part.state === "input-available") {
                    return (
                      <p
                        key={idx}
                        className="text-xs text-zinc-500 italic mt-2"
                      >
                        Looking up legal help…
                      </p>
                    );
                  }
                  if (part.state === "output-error") {
                    return (
                      <p key={idx} className="text-xs text-red-600 mt-2">
                        Couldn&apos;t load legal aid right now.
                      </p>
                    );
                  }
                }
                return null;
              })}
            </div>
          </div>
        ))}

        {isStreaming && messages.at(-1)?.role !== "assistant" && (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <div className="h-2 w-2 rounded-full bg-zinc-400 animate-pulse" />
            Thinking…
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            Something went wrong. {error.message}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={submit}
        className="border-t border-zinc-200 p-3 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            messages.length === 0
              ? "Conviction or non-conviction?"
              : "Type your answer…"
          }
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          disabled={isStreaming}
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="rounded-md bg-zinc-900 text-white text-sm font-medium px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800"
        >
          Send
        </button>
      </form>
    </div>
  );
}
