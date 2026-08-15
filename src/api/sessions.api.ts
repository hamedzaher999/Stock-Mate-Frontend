import { ApiResponse } from "@/lib/apiTypes";
import { baseApi } from "./baseApi";

export interface SessionItem {
  id: string;
  platform: "web" | "mobile";
  deviceInfo?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  accessExpiresAt: string;
  refreshExpiresAt: string;
  isCurrent: boolean;
}

export const sessionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Self-service — current user's own sessions
    getMySessions: builder.query<ApiResponse<SessionItem[]>, void>({
      query: () => "/auth/sessions",
      providesTags: ["Session"],
    }),
    revokeMySession: builder.mutation<ApiResponse<null>, string>({
      query: (sessionId) => ({
        url: `/auth/sessions/${sessionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Session"],
    }),

    // Admin — sessions for a specific user
    getUserSessions: builder.query<ApiResponse<SessionItem[]>, string>({
      query: (userId) => `/users/${userId}/sessions`,
      providesTags: (_r, _e, userId) => [{ type: "Session", id: userId }],
    }),
    revokeUserSession: builder.mutation<
      ApiResponse<null>,
      { userId: string; sessionId: string }
    >({
      query: ({ userId, sessionId }) => ({
        url: `/users/${userId}/sessions/${sessionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { userId }) => [
        { type: "Session", id: userId },
      ],
    }),
    revokeAllUserSessions: builder.mutation<ApiResponse<null>, string>({
      query: (userId) => ({
        url: `/users/${userId}/sessions/revoke-all`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, userId) => [{ type: "Session", id: userId }],
    }),
  }),
});

export const {
  useGetMySessionsQuery,
  useRevokeMySessionMutation,
  useGetUserSessionsQuery,
  useRevokeUserSessionMutation,
  useRevokeAllUserSessionsMutation,
} = sessionsApi;
