import { baseApi } from "./baseApi";
import type { ApiResponse } from "@/lib/apiTypes";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatbotReply {
  answer: string;
  hadContext: boolean;
}
export const assistantApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendAssistantMessage: builder.mutation<
      ApiResponse<ChatbotReply>,
      { message: string; history: ChatMessage[]; platform: "web" | "mobile" }
    >({
      query: (body) => ({ url: "/assistant/message", method: "POST", body }),
    }),
  }),
});

export const { useSendAssistantMessageMutation } = assistantApi;
