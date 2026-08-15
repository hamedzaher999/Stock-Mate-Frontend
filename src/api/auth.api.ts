import { baseApi } from "./baseApi";
import type { ApiResponse, UserProfile } from "@/lib/apiTypes";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    requestOtp: builder.mutation<
      ApiResponse<{ code: string }>,
      { phone?: string; email?: string; channel?: "phone" | "email" }
    >({
      query: (body) => ({ url: "/auth/otp/request", method: "POST", body }),
    }),
    verifyOtp: builder.mutation<
      ApiResponse<{ user: UserProfile }>,
      {
        phone?: string;
        email?: string;
        code: string;
        platform: "web" | "mobile";
      }
    >({
      query: (body) => ({ url: "/auth/otp/verify", method: "POST", body }),
    }),
    refresh: builder.mutation<ApiResponse<{ user: UserProfile }>, void>({
      query: () => ({ url: "/auth/refresh", method: "POST" }),
    }),
    getMe: builder.query<ApiResponse<UserProfile>, void>({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),
    logout: builder.mutation<ApiResponse<null>, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
    logoutAll: builder.mutation<ApiResponse<null>, void>({
      query: () => ({ url: "/auth/logout-all", method: "POST" }),
    }),
  }),
});

export const {
  useRequestOtpMutation,
  useVerifyOtpMutation,
  useRefreshMutation,
  useGetMeQuery,
  useLogoutMutation,
  useLogoutAllMutation,
} = authApi;
