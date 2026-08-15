import { baseApi } from "./baseApi";
import type { ApiResponse, Role, Permission, UserPermissionOverride } from "@/lib/apiTypes";

export const rbacApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query<ApiResponse<Role[]>, void>({
      query: () => "/rbac/roles",
      providesTags: ["Role"],
    }),
    getRoleById: builder.query<ApiResponse<Role>, string>({
      query: (id) => `/rbac/roles/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Role", id }],
    }),
    createRole: builder.mutation<ApiResponse<Role>, { name: string; description?: string }>({
      query: (body) => ({ url: "/rbac/roles", method: "POST", body }),
      invalidatesTags: ["Role"],
    }),
    updateRole: builder.mutation<ApiResponse<Role>, { id: string; data: { description?: string; isActive?: boolean } }>({
      query: ({ id, data }) => ({ url: `/rbac/roles/${id}`, method: "PATCH", body: data }),
      invalidatesTags: ["Role"],
    }),
    setRolePermissions: builder.mutation<ApiResponse<Role>, { id: string; permissionCodes: string[] }>({
      query: ({ id, permissionCodes }) => ({ url: `/rbac/roles/${id}/permissions`, method: "PUT", body: { permissionCodes } }),
      invalidatesTags: ["Role"],
    }),
    deleteRole: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/rbac/roles/${id}`, method: "DELETE" }),
      invalidatesTags: ["Role"],
    }),
    getPermissions: builder.query<ApiResponse<Permission[]>, void>({
      query: () => "/rbac/permissions",
      providesTags: ["Permission"],
    }),
    getUserPermissions: builder.query<ApiResponse<{ overrides: UserPermissionOverride[]; effectivePermissions: string[] }>, string>({
      query: (userId) => `/rbac/users/${userId}/permissions`,
      providesTags: (_r, _e, userId) => [{ type: "User", id: userId }],
    }),
    addUserPermission: builder.mutation<ApiResponse<UserPermissionOverride>, { userId: string; permissionCode: string; effect: "grant" | "revoke"; reason?: string }>({
      query: ({ userId, ...body }) => ({ url: `/rbac/users/${userId}/permissions`, method: "POST", body }),
      invalidatesTags: ["User"],
    }),
    addUserPermissionGroup: builder.mutation<ApiResponse<{ overrides: UserPermissionOverride[]; effectivePermissions: string[] }>, { userId: string; permissionCodes: string[]; effect: "grant" | "revoke"; reason?: string }>({
      query: ({ userId, ...body }) => ({ url: `/rbac/users/${userId}/permissions/group`, method: "POST", body }),
      invalidatesTags: ["User"],
    }),
    revokeAllUserPermissions: builder.mutation<ApiResponse<{ overrides: UserPermissionOverride[]; effectivePermissions: string[] }>, { userId: string; reason?: string }>({
      query: ({ userId, ...body }) => ({ url: `/rbac/users/${userId}/permissions/revoke-all`, method: "POST", body }),
      invalidatesTags: ["User"],
    }),
    overrideUserRole: builder.mutation<ApiResponse<{ overrides: UserPermissionOverride[]; effectivePermissions: string[] }>, { userId: string; sourceRoleId: string; reason?: string }>({
      query: ({ userId, ...body }) => ({ url: `/rbac/users/${userId}/permissions/override-role`, method: "POST", body }),
      invalidatesTags: ["User"],
    }),
    deleteUserPermission: builder.mutation<ApiResponse<null>, { userId: string; permissionCode: string }>({
      query: ({ userId, permissionCode }) => ({ url: `/rbac/users/${userId}/permissions/${permissionCode}`, method: "DELETE" }),
      invalidatesTags: ["User"],
    }),
    resetUserPermissions: builder.mutation<ApiResponse<null>, string>({
      query: (userId) => ({ url: `/rbac/users/${userId}/permissions`, method: "DELETE" }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetRolesQuery, useGetRoleByIdQuery, useCreateRoleMutation, useUpdateRoleMutation,
  useSetRolePermissionsMutation, useDeleteRoleMutation, useGetPermissionsQuery,
  useGetUserPermissionsQuery, useAddUserPermissionMutation, useAddUserPermissionGroupMutation,
  useRevokeAllUserPermissionsMutation, useOverrideUserRoleMutation,
  useDeleteUserPermissionMutation, useResetUserPermissionsMutation,
} = rbacApi;
