"use client";

import useSWR from "swr";
import { browserApiFetch } from "@/lib/api/browser";
import type { ConversationsResponse } from "@/lib/messaging/types";

// No push/realtime transport exists on the backend yet (see
// modules/messaging/messaging.service.ts's doc comment) - this interval is
// the whole "real-time" story for now. Short enough that a new message
// shows up without a manual refresh, long enough not to hammer the API
// while a conversation list is just sitting open in a tab.
const POLL_INTERVAL_MS = 10_000;

function fetchConversations(path: string): Promise<ConversationsResponse> {
  return browserApiFetch<ConversationsResponse>(path);
}

export function useConversations() {
  const { data, error, isLoading, mutate } = useSWR<ConversationsResponse>(
    "/api/v1/messaging/conversations?limit=50",
    fetchConversations,
    { refreshInterval: POLL_INTERVAL_MS },
  );

  return {
    conversations: data?.conversations ?? [],
    total: data?.total ?? 0,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refresh: mutate,
  };
}
