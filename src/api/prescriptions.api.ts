import { baseApi } from "./baseApi";
import type { ApiResponse, PaginatedResult, Prescription } from "@/lib/apiTypes";

export const prescriptionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPrescriptions: builder.query<ApiResponse<PaginatedResult<Prescription>>, { page?: number; limit?: number; patientId?: string; doctorId?: string; status?: string } | void>({
      query: (params) => ({ url: "/prescriptions", params: params ?? {} }),
      providesTags: ["Prescription"],
    }),
    getPrescriptionById: builder.query<ApiResponse<Prescription>, string>({
      query: (id) => `/prescriptions/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Prescription", id }],
    }),
    renewPrescription: builder.mutation<ApiResponse<Prescription>, { id: string; data: { visitId: string; frequencyUnit?: string; frequencyInterval?: number; totalCycles?: number; startDate: string; items: Array<{ variantId: string; prescribedQuantity: number; dosage?: string; frequency?: string; durationDays?: number }> } }>({
      query: ({ id, data }) => ({ url: `/prescriptions/${id}/renew`, method: "POST", body: data }),
      invalidatesTags: ["Prescription"],
    }),
    cancelPrescription: builder.mutation<ApiResponse<Prescription>, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/prescriptions/${id}/cancel`, method: "POST", body: { reason } }),
      invalidatesTags: ["Prescription"],
    }),
  }),
});

export const {
  useGetPrescriptionsQuery, useGetPrescriptionByIdQuery,
  useRenewPrescriptionMutation, useCancelPrescriptionMutation,
} = prescriptionsApi;
