"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { browserApiFetch } from "@/lib/api/browser";
import { ApiClientError } from "@/lib/api/errors";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { useConversations } from "@/hooks/useConversations";
import type { ConversationSummary } from "@/lib/messaging/types";

export type MessagesViewProps = {
  currentUserId: string;
};

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MessagesView({ currentUserId }: MessagesViewProps) {
  const { conversations, isLoading, error, refresh } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Mobile-only: which panel is showing. Separate from selectedId because
  // "go back to the list" on mobile must not clear which thread is
  // selected on desktop (both panels share this component's state).
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);

  // Defaults to the first conversation until the user picks one - derived
  // directly in render rather than an effect + setState, which would cost
  // an extra render pass for a value that's already computable now.
  const selected =
    conversations.find((item) => item.id === selectedId) ?? conversations[0] ?? null;

  if (isLoading && conversations.length === 0) {
    return <LoadingSkeleton label="Loading conversations" lines={5} />;
  }

  if (error && conversations.length === 0) {
    return (
      <ErrorState
        description="We couldn't load your messages. Check your connection and try again."
        onRetry={() => void refresh()}
      />
    );
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        title="No conversations yet"
        description="Messages you send from a braider's profile, or that a client sends you, will show up here."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[320px_1fr] md:gap-0 md:overflow-hidden md:rounded-[var(--radius-panel)] md:border md:border-[var(--color-border)]">
      <div
        className={`border-[var(--color-border)] md:h-[70vh] md:overflow-y-auto md:border-r ${mobileThreadOpen ? "hidden md:block" : ""}`}
      >
        <ul role="list" aria-label="Conversations">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(conversation.id);
                  setMobileThreadOpen(true);
                }}
                aria-current={conversation.id === selectedId ? "true" : undefined}
                className={`flex w-full flex-col gap-1 border-b border-[var(--color-border)] px-4 py-3 text-left transition-colors ${
                  conversation.id === selectedId
                    ? "bg-[var(--color-brand-soft)]"
                    : "hover:bg-[var(--color-brand-soft)]/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                    {conversation.counterpart.name}
                  </span>
                  {conversation.unreadCount > 0 ? (
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[var(--color-brand)] text-xs font-bold text-[var(--color-text-inverse)]">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </div>
                <span className="truncate text-xs text-[var(--color-text-muted)]">
                  {conversation.lastMessage?.body ?? "No messages yet"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div
        className={`md:h-[70vh] ${mobileThreadOpen ? "" : "hidden md:flex md:items-center md:justify-center"}`}
      >
        {selected ? (
          <Thread
            key={selected.id}
            conversation={selected}
            currentUserId={currentUserId}
            onBack={() => setMobileThreadOpen(false)}
            onSent={() => void refresh()}
          />
        ) : (
          <p className="p-6 text-sm text-[var(--color-text-muted)]">
            Select a conversation to view messages.
          </p>
        )}
      </div>
    </div>
  );
}

function Thread({
  conversation,
  currentUserId,
  onBack,
  onSent,
}: {
  conversation: ConversationSummary;
  currentUserId: string;
  onBack: () => void;
  onSent: () => void;
}) {
  const { messages, isLoading, error, refresh } = useConversationMessages(conversation.id);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    void browserApiFetch(`/api/v1/messaging/conversations/${conversation.id}/read`, {
      method: "POST",
    }).catch(() => {
      // Best-effort - an unread badge staying lit one poll cycle longer
      // than necessary isn't worth surfacing an error for.
    });
  }, [conversation.id]);

  async function handleSend() {
    const body = draft.trim();
    if (!body || sending) return;

    setSending(true);
    setSendError(null);
    try {
      await browserApiFetch(`/api/v1/messaging/conversations/${conversation.id}/messages`, {
        method: "POST",
        body: { body },
      });
      setDraft("");
      await refresh();
      onSent();
    } catch (err) {
      setSendError(
        err instanceof ApiClientError ? err.message : "Your message could not be sent.",
      );
    } finally {
      setSending(false);
    }
  }

  // Oldest first for display - the API returns newest-first for
  // pagination (see messaging.repository.ts's listMessages).
  const ordered = [...messages].reverse();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="btn-ghost !min-h-9 !px-2 md:hidden"
        >
          ←
        </button>
        <p className="font-semibold text-[var(--color-text-primary)]">
          {conversation.counterpart.name}
        </p>
        {conversation.appointmentId ? (
          <Link
            href="/account/appointments"
            className="ml-auto text-xs font-semibold text-[var(--color-brand)]"
          >
            Related appointment
          </Link>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && messages.length === 0 ? (
          <LoadingSkeleton label="Loading messages" lines={4} />
        ) : error && messages.length === 0 ? (
          <ErrorState description="Couldn't load this conversation." onRetry={() => void refresh()} />
        ) : (
          <ul role="list" aria-label="Messages" className="grid gap-3">
            {ordered.map((message) => {
              const mine = message.senderId === currentUserId;
              return (
                <li
                  key={message.id}
                  className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-[var(--radius-control)] px-3 py-2 text-sm ${
                      mine
                        ? "bg-[var(--color-brand)] text-[var(--color-text-inverse)]"
                        : "bg-[var(--color-brand-soft)] text-[var(--color-text-primary)]"
                    }`}
                  >
                    {message.body}
                  </div>
                  <span className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {formatTimestamp(message.createdAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-[var(--color-border)] p-3">
        {sendError ? (
          <p role="alert" className="mb-2 text-sm text-[var(--color-danger)]">
            {sendError}
          </p>
        ) : null}
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSend();
          }}
        >
          <label className="sr-only" htmlFor="message-composer">
            Message
          </label>
          <input
            id="message-composer"
            className="min-h-11 flex-1 rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 text-sm focus-ring"
            placeholder="Type a message…"
            value={draft}
            maxLength={2000}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button type="submit" loading={sending} disabled={!draft.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
