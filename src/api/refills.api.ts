import { baseApi } from "./baseApi";
import type { ApiResponse, PaginatedResult, RefillRequest, Delivery, PeriodicSchedule } from "@/lib/apiTypes";

export const refillsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRefillRequests: builder.query<ApiResponse<PaginatedResult<RefillRequest>>, { page?: number; limit?: number; status?: string } | void>({
      query: (params) => ({ url: "/department-refills/requests", params: params ?? {} }),
      providesTags: ["RefillRequest"],
    }),
    getRefillRequestById: builder.query<ApiResponse<RefillRequest>, string>({
      query: (id) => `/department-refills/requests/${id}`,
      providesTags: (_r, _e, id) => [{ type: "RefillRequest", id }],
    }),
    createRefillRequest: builder.mutation<ApiResponse<RefillRequest>, { items: Array<{ variantId: string; requestedQuantity: number }>; priority?: string; requestType?: string; frequencyInterval?: number; notes?: string; departmentId?: string }>({
      query: (body) => ({ url: "/department-refills/requests", method: "POST", body }),
      invalidatesTags: ["RefillRequest"],
    }),
    updateRefillRequest: builder.mutation<ApiResponse<RefillRequest>, { id: string; data: { notes?: string; items?: Array<{ variantId: string; requestedQuantity: number }> } }>({
      query: ({ id, data }) => ({ url: `/department-refills/requests/${id}`, method: "PATCH", body: data }),
      invalidatesTags: ["RefillRequest"],
    }),
    submitRefillRequest: builder.mutation<ApiResponse<RefillRequest>, string>({
      query: (id) => ({ url: `/department-refills/requests/${id}/submit`, method: "POST" }),
      invalidatesTags: ["RefillRequest"],
    }),
    hospitalApproveRefill: builder.mutation<ApiResponse<RefillRequest>, { id: string }>({
      query: ({ id }) => ({ url: `/department-refills/requests/${id}/hospital-approve`, method: "POST" }),
      invalidatesTags: ["RefillRequest"],
    }),
    hospitalRejectRefill: builder.mutation<ApiResponse<RefillRequest>, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/department-refills/requests/${id}/hospital-reject`, method: "POST", body: { reason } }),
      invalidatesTags: ["RefillRequest"],
    }),
    managerApproveRefill: builder.mutation<ApiResponse<RefillRequest>, { id: string; items: Array<{ refillItemId: string; approvedQuantity: number }>; approvalPolicy?: "auto_approved" | "approval_required_each_cycle" }>({
      query: ({ id, ...body }) => ({ url: `/department-refills/requests/${id}/approve`, method: "POST", body }),
      invalidatesTags: ["RefillRequest", "PeriodicSchedule"],
    }),
    managerRejectRefill: builder.mutation<ApiResponse<RefillRequest>, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/department-refills/requests/${id}/reject`, method: "POST", body: { reason } }),
      invalidatesTags: ["RefillRequest"],
    }),
    completeRefillRequest: builder.mutation<ApiResponse<RefillRequest>, string>({
      query: (id) => ({ url: `/department-refills/requests/${id}/complete`, method: "POST" }),
      invalidatesTags: ["RefillRequest"],
    }),
    cancelRefillRequest: builder.mutation<ApiResponse<RefillRequest>, string>({
      query: (id) => ({ url: `/department-refills/requests/${id}/cancel`, method: "POST" }),
      invalidatesTags: ["RefillRequest"],
    }),
    // Deliveries
    getDeliveries: builder.query<ApiResponse<PaginatedResult<Delivery>>, { page?: number; limit?: number; refillRequestId?: string } | void>({
      query: (params) => ({ url: "/department-refills/deliveries", params: params ?? {} }),
      providesTags: ["Delivery"],
    }),
    getDeliveryById: builder.query<ApiResponse<Delivery>, string>({
      query: (id) => `/department-refills/deliveries/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Delivery", id }],
    }),
    createDelivery: builder.mutation<ApiResponse<Delivery>, { refillRequestId: string; notes?: string; type?: "batch" | "final_batch"; items: Array<{ refillItemId: string; batchId: string; shippedQuantity: number }> }>({
      query: (body) => ({ url: "/department-refills/deliveries", method: "POST", body }),
      invalidatesTags: ["Delivery", "RefillRequest", "LiveStock"],
    }),
    confirmDelivery: builder.mutation<ApiResponse<Delivery>, { id: string; notes?: string; items: Array<{ deliveryItemId: string; receivedQuantity: number }> }>({
      query: ({ id, ...body }) => ({ url: `/department-refills/deliveries/${id}/confirm`, method: "POST", body }),
      invalidatesTags: ["Delivery", "RefillRequest", "LiveStock"],
    }),
    // Periodic Schedules
    getPeriodicSchedules: builder.query<ApiResponse<PaginatedResult<PeriodicSchedule>>, { page?: number; limit?: number; departmentId?: string; status?: string } | void>({
      query: (params) => ({ url: "/department-refills/periodic-schedules", params: params ?? {} }),
      providesTags: ["PeriodicSchedule"],
    }),
    getPeriodicScheduleById: builder.query<ApiResponse<PeriodicSchedule>, string>({
      query: (id) => `/department-refills/periodic-schedules/${id}`,
      providesTags: (_r, _e, id) => [{ type: "PeriodicSchedule", id }],
    }),
    cancelPeriodicSchedule: builder.mutation<ApiResponse<PeriodicSchedule>, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/department-refills/periodic-schedules/${id}/cancel`, method: "POST", body: { reason } }),
      invalidatesTags: ["PeriodicSchedule"],
    }),
  }),
});

export const {
  useGetRefillRequestsQuery, useGetRefillRequestByIdQuery, useCreateRefillRequestMutation,
  useUpdateRefillRequestMutation, useSubmitRefillRequestMutation,
  useHospitalApproveRefillMutation, useHospitalRejectRefillMutation,
  useManagerApproveRefillMutation, useManagerRejectRefillMutation,
  useCompleteRefillRequestMutation, useCancelRefillRequestMutation,
  useGetDeliveriesQuery, useGetDeliveryByIdQuery, useCreateDeliveryMutation, useConfirmDeliveryMutation,
  useGetPeriodicSchedulesQuery, useGetPeriodicScheduleByIdQuery, useCancelPeriodicScheduleMutation,
} = refillsApi;
