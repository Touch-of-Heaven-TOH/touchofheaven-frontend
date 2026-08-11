export type ConversationSummary = {
  id: string;
  appointmentId: string | null;
  lastMessageAt: string;
  unreadCount: number;
  counterpart: { id: string; name: string };
  lastMessage: { body: string; senderId: string; createdAt: string } | null;
};

export type ConversationsResponse = {
  conversations: ConversationSummary[];
  total: number;
  page: number;
  limit: number;
};

export type MessageItem = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

export type MessagesResponse = {
  messages: MessageItem[];
  total: number;
  page: number;
  limit: number;
};
