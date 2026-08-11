"use client";

import useSWR from "swr";
import { browserApiFetch } from "@/lib/api/browser";
import type { MessagesResponse } from "@/lib/messaging/types";

// Faster than the conversation list's poll (useConversations.ts) since
// this is the thread the user is actively looking at.
const POLL_INTERVAL_MS = 4_000;

function fetchMessages(path: string): Promise<MessagesResponse> {
  return browserApiFetch<MessagesResponse>(path);
}

export function useConversationMessages(conversationId: string | null) {
  const key = conversationId
    ? `/api/v1/messaging/conversations/${conversationId}/messages?limit=100`
    : null;

  const { data, error, isLoading, mutate } = useSWR<MessagesResponse>(
    key,
    fetchMessages,
    { refreshInterval: POLL_INTERVAL_MS },
  );

  return {
    messages: data?.messages ?? [],
    isLoading,
    error: error instanceof Error ? error.message : null,
    refresh: mutate,
  };
}
