import { baseApi } from "./baseApi";
import type { ApiResponse, PaginatedResult, Department } from "@/lib/apiTypes";
export type DeptSelectorContext =
  | "stock"
  | "batches"
  | "queue"
  | "refill-requests"
  | "periodic-schedules"
  | "disposal";
export interface SelectableDepartmentsResponse {
  scoped: boolean;
  departments: { id: string; name: string; type: string }[];
}

export const departmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query<
      ApiResponse<PaginatedResult<Department>>,
      {
        page?: number;
        limit?: number;
        type?: string;
        isActive?: boolean;
        hasManager?: boolean;
        search?: string;
      } | void
    >({
      query: (params) => ({ url: "/departments", params: params ?? {} }),
      providesTags: ["Department"],
    }),
    getDepartmentById: builder.query<ApiResponse<Department>, string>({
      query: (id) => `/departments/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Department", id }],
    }),
    createDepartment: builder.mutation<
      ApiResponse<Department>,
      { name: string; type: string; managerId?: string; hasQueue?: boolean }
    >({
      query: (body) => ({ url: "/departments", method: "POST", body }),
      invalidatesTags: ["Department"],
    }),
    updateDepartment: builder.mutation<
      ApiResponse<Department>,
      { id: string; data: { name?: string; hasQueue?: boolean } }
    >({
      query: ({ id, data }) => ({
        url: `/departments/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Department"],
    }),
    updateDepartmentStatus: builder.mutation<
      ApiResponse<Department>,
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/departments/${id}/status`,
        method: "PATCH",
        body: { isActive },
      }),
      invalidatesTags: ["Department"],
    }),
    updateDepartmentManager: builder.mutation<
      ApiResponse<Department>,
      { id: string; managerId: string | null }
    >({
      query: ({ id, managerId }) => ({
        url: `/departments/${id}/manager`,
        method: "PATCH",
        body: { managerId },
      }),
      invalidatesTags: ["Department"],
    }),
    getSelectableDepartments: builder.query<
      ApiResponse<SelectableDepartmentsResponse>,
      DeptSelectorContext
    >({
      query: (context) => ({
        url: "/departments/selectable",
        params: { context },
      }),
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useUpdateDepartmentStatusMutation,
  useUpdateDepartmentManagerMutation,
  useGetSelectableDepartmentsQuery,
} = departmentsApi;
