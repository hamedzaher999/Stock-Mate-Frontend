import { baseApi } from "./baseApi";
import type {
  ApiResponse,
  PaginatedResult,
  Notification,
} from "@/lib/apiTypes";

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      ApiResponse<PaginatedResult<Notification>>,
      {
        page?: number;
        limit?: number;
        isRead?: boolean;
        category?: string;
      } | void
    >({
      query: (params) => ({ url: "/notifications", params: params ?? {} }),
      providesTags: ["Notification"],
    }),
    registerDeviceToken: builder.mutation<
      ApiResponse<unknown>,
      { fcmToken: string; platform: "web" | "mobile" }
    >({
      query: (body) => ({
        url: "/notifications/device-tokens",
        method: "POST",
        body,
      }),
    }),
    unregisterDeviceToken: builder.mutation<ApiResponse<null>, string>({
      query: (fcmToken) => ({
        url: `/notifications/device-tokens/${fcmToken}`,
        method: "DELETE",
      }),
    }),
    getUnreadCount: builder.query<ApiResponse<{ count: number }>, void>({
      query: () => "/notifications/unread-count",
      providesTags: ["UnreadCount"],
    }),
    markNotificationRead: builder.mutation<ApiResponse<Notification>, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Notification", "UnreadCount"],
    }),
    markAllRead: builder.mutation<ApiResponse<null>, void>({
      query: () => ({ url: "/notifications/read-all", method: "PATCH" }),
      invalidatesTags: ["Notification", "UnreadCount"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllReadMutation,
  useRegisterDeviceTokenMutation,
  useUnregisterDeviceTokenMutation,
} = notificationsApi;
