import { baseApi } from "./baseApi";
import type { ApiResponse, PaginatedResult, UserProfile, UserListItem } from "@/lib/apiTypes";

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyProfile: builder.query<ApiResponse<UserProfile>, void>({
      query: () => "/users/me",
      providesTags: ["User"],
    }),
    updateMyProfile: builder.mutation<ApiResponse<UserListItem>, { phone?: string; email?: string }>({
      query: (body) => ({ url: "/users/me", method: "PATCH", body }),
      invalidatesTags: ["User"],
    }),
    getUsers: builder.query<
      ApiResponse<PaginatedResult<UserListItem>>,
      { page?: number; limit?: number; departmentId?: string; roleId?: string; status?: string; search?: string }
    >({
      query: (params) => ({ url: "/users", params }),
      providesTags: ["User"],
    }),
    getUserById: builder.query<ApiResponse<UserProfile>, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_r, _e, id) => [{ type: "User", id }],
    }),
    createUser: builder.mutation<
      ApiResponse<UserListItem>,
      { fullName: string; phone?: string; email?: string; roleId: string; departmentId?: string; specialty?: string }
    >({
      query: (body) => ({ url: "/users", method: "POST", body }),
      invalidatesTags: ["User"],
    }),
    updateUser: builder.mutation<ApiResponse<UserListItem>, { id: string; data: Partial<{ fullName: string; phone: string; email: string; roleId: string; departmentId: string; specialty: string }> }>({
      query: ({ id, data }) => ({ url: `/users/${id}`, method: "PATCH", body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "User", id }, "User"],
    }),
    updateUserStatus: builder.mutation<ApiResponse<UserListItem>, { id: string; status: "active" | "inactive" }>({
      query: ({ id, status }) => ({ url: `/users/${id}/status`, method: "PATCH", body: { status } }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
} = usersApi;
