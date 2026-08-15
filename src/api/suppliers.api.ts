import { baseApi } from "./baseApi";
import type { ApiResponse, PaginatedResult, Supplier, VariantListItem } from "@/lib/apiTypes";

export const suppliersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<ApiResponse<PaginatedResult<Supplier>>, { page?: number; limit?: number; isActive?: boolean; search?: string } | void>({
      query: (params) => ({ url: "/suppliers", params: params ?? {} }),
      providesTags: ["Supplier"],
    }),
    getSupplierById: builder.query<ApiResponse<Supplier>, string>({
      query: (id) => `/suppliers/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Supplier", id }],
    }),
    getSupplierVariants: builder.query<ApiResponse<PaginatedResult<VariantListItem>>, { id: string; page?: number; limit?: number }>({
      query: ({ id, ...params }) => ({ url: `/suppliers/${id}/variants`, params }),
      providesTags: ["Variant"],
    }),
    createSupplier: builder.mutation<ApiResponse<Supplier>, { name: string; phone?: string; email?: string; address?: string }>({
      query: (body) => ({ url: "/suppliers", method: "POST", body }),
      invalidatesTags: ["Supplier"],
    }),
    updateSupplier: builder.mutation<ApiResponse<Supplier>, { id: string; data: Partial<{ name: string; phone: string; email: string; address: string }> }>({
      query: ({ id, data }) => ({ url: `/suppliers/${id}`, method: "PATCH", body: data }),
      invalidatesTags: ["Supplier"],
    }),
    updateSupplierStatus: builder.mutation<ApiResponse<Supplier>, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({ url: `/suppliers/${id}/status`, method: "PATCH", body: { isActive } }),
      invalidatesTags: ["Supplier"],
    }),
  }),
});

export const {
  useGetSuppliersQuery, useGetSupplierByIdQuery, useGetSupplierVariantsQuery,
  useCreateSupplierMutation, useUpdateSupplierMutation, useUpdateSupplierStatusMutation,
} = suppliersApi;
