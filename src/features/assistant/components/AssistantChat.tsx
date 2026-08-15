import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Send } from "lucide-react";
import { Button } from "@/components/primitive/button";
import { Textarea } from "@/components/primitive/textarea";
import { cn } from "@/lib/formatters";
import {
  useSendAssistantMessageMutation,
  type ChatMessage,
} from "@/api/assistant.api";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

const HISTORY_LIMIT = 20;

interface AssistantChatProps {
  variant?: "panel" | "page";
}

export default function AssistantChat({
  variant = "panel",
}: AssistantChatProps) {
  const { t } = useTranslation("assistant");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [sendMessage, { isLoading }] = useSendAssistantMessageMutation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;

    const nextMessages: DisplayMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(nextMessages);
    setInput("");

    const history: ChatMessage[] = nextMessages
      .filter((m) => !m.error)
      .slice(-HISTORY_LIMIT)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await sendMessage({ message: text, history }).unwrap();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.answer },
      ]);
    } catch (e: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            (e as { data?: { message?: string } })?.data?.message ??
            t("errorGeneric"),
          error: true,
        },
      ]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col",
        variant === "panel" ? "h-112" : "h-[calc(100vh-(--spacing(14))-3rem)]",
      )}
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pe-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-muted-foreground">
            <div className="rounded-2xl bg-primary/10 p-3">
              <Sparkles className="size-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {t("emptyTitle")}
            </p>
            <p className="text-xs max-w-xs">{t("emptyDescription")}</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : m.error
                    ? "bg-danger/10 text-danger border border-danger/30"
                    : "bg-muted text-foreground",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-3.5 py-2.5 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
              <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
              <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
            </div>
          </div>
        )}
      </div>

      <div className="pt-3 mt-1 border-t border-border flex items-end gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("inputPlaceholder")}
          rows={1}
          maxLength={2000}
          className="min-h-9 max-h-32 resize-none py-2"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          loading={isLoading}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
