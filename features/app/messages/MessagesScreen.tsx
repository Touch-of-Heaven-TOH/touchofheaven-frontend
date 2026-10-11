"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/app/Icon";
import { InitialsAvatar } from "@/components/app/art";
import { BusinessAvatar, Empty } from "@/components/app/ui";
import { useViewer } from "@/components/providers/ViewerProvider";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { browserApiFetch } from "@/lib/api/browser";
import { ApiClientError } from "@/lib/api/errors";
import { useConversations } from "@/lib/app/data";
import { formatRelative, formatTime } from "@/lib/app/format";
import type { Conversation } from "@/lib/app/types";

type Filter = "all" | "unread" | "business";

const QUICK_REPLIES = ["What time works for you?", "Can I see more of your work?", "Thank you!"];

function Avatar({ conversation, size }: { conversation: Conversation; size: number }) {
  const { counterpart } = conversation;
  return counterpart.isBusiness ? (
    <BusinessAvatar id={counterpart.id} category={counterpart.businessCategory ?? null} size={size} />
  ) : (
    <InitialsAvatar name={counterpart.name} size={size} />
  );
}

export function MessagesScreen() {
  const viewer = useViewer();
  const router = useRouter();
  const params = useSearchParams();
  const openId = params.get("c");
  const { conversations, isLoading, refresh } = useConversations(Boolean(viewer));
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  // Stable, so the thread's mark-as-read effect runs once per conversation.
  const reload = useCallback(() => void refresh(), [refresh]);

  const visible = conversations.filter((conversation) => {
    if (filter === "unread" && !conversation.unreadCount) return false;
    if (filter === "business" && !conversation.counterpart.isBusiness) return false;
    return !query.trim() || conversation.counterpart.name.toLowerCase().includes(query.trim().toLowerCase());
  });
  // Desktop shows the newest thread straight away; phones start on the list.
  const selected = conversations.find((conversation) => conversation.id === openId) ?? null;
  const shown = selected ?? conversations[0] ?? null;

  const open = (id: string | null) => router.replace(id ? `/messages?c=${id}` : "/messages", { scroll: false });

  return (
    <div className={`toh-msgs${selected ? " is-thread" : ""}`}>
      <section className="toh-mlist" aria-label="Conversations">
        <div className="toh-mlist__hd">
          <h1>Messages</h1>
          <label className="toh-search toh-search--sm">
            <Icon name="search" size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations" aria-label="Search conversations" />
          </label>
          <div className="toh-chips">
            {(
              [
                ["all", "All"],
                ["unread", "Unread"],
                ["business", "Businesses"],
              ] as const
            ).map(([key, label]) => (
              <button key={key} type="button" className={`toh-chip toh-chip--sm${filter === key ? " is-on" : ""}`} onClick={() => setFilter(key)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="toh-mlist__scroll">
          {isLoading && !conversations.length ? (
            <div style={{ padding: 18 }} className="toh-stack">
              {[0, 1, 2].map((key) => (
                <div key={key} className="toh-skeleton" style={{ height: 58 }} />
              ))}
            </div>
          ) : visible.length ? (
            visible.map((conversation) => {
              const last = conversation.lastMessage;
              const mine = last && viewer && last.senderId === viewer.id;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  className={`toh-mi${conversation.id === shown?.id ? " is-on" : ""}${conversation.unreadCount ? " is-unread" : ""}`}
                  onClick={() => open(conversation.id)}
                >
                  <Avatar conversation={conversation} size={46} />
                  <span className="toh-mi__t">
                    <b>
                      <span>{conversation.counterpart.name}</span>
                      <small>{formatRelative(conversation.lastMessageAt)}</small>
                    </b>
                    <p>
                      {mine ? "You: " : ""}
                      {last?.body ?? "No messages yet"}
                    </p>
                  </span>
                  {conversation.unreadCount ? <span className="toh-mi__dot" aria-label={`${conversation.unreadCount} unread`} /> : null}
                </button>
              );
            })
          ) : (
            <Empty icon="chat" title={conversations.length ? "No conversations match" : "No messages yet"}>
              <span>Message a business from its page to ask about a style, a price or a time.</span>
              {conversations.length ? null : (
                <Link href="/businesses" className="toh-btn toh-btn--sm toh-btn--dark toh-btn--pill">
                  Find a business
                </Link>
              )}
            </Empty>
          )}
        </div>
      </section>

      <section className="toh-mthread" aria-label="Conversation">
        {shown && viewer ? (
          <Thread key={shown.id} conversation={shown} viewerId={viewer.id} onBack={() => open(null)} onChange={reload} />
        ) : (
          <div className="toh-mthread__none">
            <Empty icon="chat" title="Your conversations show here" />
          </div>
        )}
      </section>
    </div>
  );
}

function Thread({
  conversation,
  viewerId,
  onBack,
  onChange,
}: {
  conversation: Conversation;
  viewerId: string;
  onBack: () => void;
  onChange: () => void;
}) {
  const { messages, isLoading, refresh } = useConversationMessages(conversation.id);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const { counterpart } = conversation;

  useEffect(() => {
    void browserApiFetch(`/api/v1/messaging/conversations/${conversation.id}/read`, { method: "POST" })
      .then(onChange)
      .catch(() => {
        // Best effort: the unread dot clears on the next poll anyway.
      });
  }, [conversation.id, onChange]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const send = async (text: string) => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setFailure(null);
    try {
      await browserApiFetch(`/api/v1/messaging/conversations/${conversation.id}/messages`, { method: "POST", body: { body } });
      setDraft("");
      await refresh();
      onChange();
    } catch (caught) {
      setFailure(caught instanceof ApiClientError ? caught.message : "Your message could not be sent.");
    } finally {
      setSending(false);
    }
  };

  // The API pages newest first; read oldest first.
  const ordered = [...messages].reverse();

  return (
    <>
      <header className="toh-mthread__hd">
        <button type="button" className="toh-icon-btn toh-only-phone" aria-label="Back to conversations" onClick={onBack}>
          <Icon name="arrowL" />
        </button>
        <Avatar conversation={conversation} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <b className="toh-mthread__nm">{counterpart.name}</b>
          <small className="toh-muted">{counterpart.isBusiness ? "Business" : "Client"}</small>
        </div>
        {conversation.appointmentId ? (
          <Link href={`/bookings/${conversation.appointmentId}`} className="toh-btn toh-btn--sm toh-btn--line toh-btn--pill toh-only-desk">
            Booking
          </Link>
        ) : null}
        {counterpart.isBusiness ? (
          <>
            <Link href={`/businesses/${counterpart.id}/book`} className="toh-btn toh-btn--sm toh-btn--dark toh-btn--pill">
              Book
            </Link>
            <Link href={`/businesses/${counterpart.id}`} className="toh-btn toh-btn--sm toh-btn--line toh-btn--pill toh-only-desk">
              Profile
            </Link>
          </>
        ) : null}
      </header>
      <div className="toh-mthread__body">
        {isLoading && !messages.length ? (
          <div className="toh-skeleton" style={{ height: 120 }} />
        ) : ordered.length ? (
          ordered.map((message) => (
            <div key={message.id} className={`toh-bub ${message.senderId === viewerId ? "is-me" : "is-them"}`}>
              {message.body}
              <small>{formatTime(message.createdAt)}</small>
            </div>
          ))
        ) : (
          <p className="toh-muted" style={{ textAlign: "center", fontSize: 13 }}>
            Say hello to {counterpart.name}. They usually reply within the day.
          </p>
        )}
        <div ref={bottom} />
      </div>
      {counterpart.isBusiness ? (
        <div className="toh-qr">
          {QUICK_REPLIES.map((reply) => (
            <button key={reply} type="button" className="toh-chip toh-chip--sm" onClick={() => void send(reply)} disabled={sending}>
              {reply}
            </button>
          ))}
        </div>
      ) : null}
      {failure ? (
        <p role="alert" className="toh-notice toh-notice--error" style={{ margin: "0 18px 8px" }}>
          {failure}
        </p>
      ) : null}
      <form
        className="toh-comp"
        onSubmit={(event) => {
          event.preventDefault();
          void send(draft);
        }}
      >
        <label className="sr-only" htmlFor="message-input">
          Message
        </label>
        <input
          id="message-input"
          value={draft}
          maxLength={2000}
          autoComplete="off"
          placeholder="Type a message"
          onChange={(event) => setDraft(event.target.value)}
        />
        <button className="toh-btn toh-btn--pill" aria-label="Send" disabled={!draft.trim() || sending}>
          <Icon name="send" size={18} />
        </button>
      </form>
    </>
  );
}
