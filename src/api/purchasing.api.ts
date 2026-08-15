import { baseApi } from "./baseApi";
import type {
  ApiResponse,
  PaginatedResult,
  PurchaseRequest,
  PurchaseReceipt,
  PurchaseReceiptImageUrl,
} from "@/lib/apiTypes";

export const purchasingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Purchase Requests
    getPurchaseRequests: builder.query<
      ApiResponse<PaginatedResult<PurchaseRequest>>,
      { page?: number; limit?: number; status?: string } | void
    >({
      query: (params) => ({
        url: "/purchasing/requests",
        params: params ?? {},
      }),
      providesTags: ["PurchaseRequest"],
    }),
    getPurchaseRequestById: builder.query<ApiResponse<PurchaseRequest>, string>(
      {
        query: (id) => `/purchasing/requests/${id}`,
        providesTags: (_r, _e, id) => [{ type: "PurchaseRequest", id }],
      },
    ),
    createPurchaseRequest: builder.mutation<
      ApiResponse<PurchaseRequest>,
      {
        items: Array<{
          variantId: string;
          requestedQuantity: number;
          estimatedPrice?: number;
          notes?: string;
        }>;
        notes?: string;
      }
    >({
      query: (body) => ({ url: "/purchasing/requests", method: "POST", body }),
      invalidatesTags: ["PurchaseRequest"],
    }),
    updatePurchaseRequest: builder.mutation<
      ApiResponse<PurchaseRequest>,
      {
        id: string;
        data: {
          items?: Array<{
            variantId: string;
            requestedQuantity: number;
            estimatedPrice?: number;
            notes?: string;
          }>;
          notes?: string;
        };
      }
    >({
      query: ({ id, data }) => ({
        url: `/purchasing/requests/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["PurchaseRequest"],
    }),
    submitPurchaseRequest: builder.mutation<
      ApiResponse<PurchaseRequest>,
      string
    >({
      query: (id) => ({
        url: `/purchasing/requests/${id}/submit`,
        method: "POST",
      }),
      invalidatesTags: ["PurchaseRequest"],
    }),
    hospitalApprovePR: builder.mutation<ApiResponse<PurchaseRequest>, string>({
      query: (id) => ({
        url: `/purchasing/requests/${id}/hospital-approve`,
        method: "POST",
      }),
      invalidatesTags: ["PurchaseRequest"],
    }),
    hospitalRejectPR: builder.mutation<
      ApiResponse<PurchaseRequest>,
      { id: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/purchasing/requests/${id}/hospital-reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["PurchaseRequest"],
    }),
    managerApprovePR: builder.mutation<
      ApiResponse<PurchaseRequest>,
      {
        id: string;
        items: Array<{
          purchaseRequestItemId: string;
          approvedQuantity: number;
        }>;
      }
    >({
      query: ({ id, items }) => ({
        url: `/purchasing/requests/${id}/approve`,
        method: "POST",
        body: { items },
      }),
      invalidatesTags: ["PurchaseRequest"],
    }),
    managerRejectPR: builder.mutation<
      ApiResponse<PurchaseRequest>,
      { id: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/purchasing/requests/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["PurchaseRequest"],
    }),
    completePurchaseRequest: builder.mutation<
      ApiResponse<PurchaseRequest>,
      string
    >({
      query: (id) => ({
        url: `/purchasing/requests/${id}/complete`,
        method: "POST",
      }),
      invalidatesTags: ["PurchaseRequest"],
    }),
    cancelPurchaseRequest: builder.mutation<
      ApiResponse<PurchaseRequest>,
      string
    >({
      query: (id) => ({
        url: `/purchasing/requests/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: ["PurchaseRequest"],
    }),
    // Purchase Receipts
    getPurchaseReceipts: builder.query<
      ApiResponse<PaginatedResult<PurchaseReceipt>>,
      { page?: number; limit?: number; purchaseRequestId?: string } | void
    >({
      query: (params) => ({
        url: "/purchasing/receipts",
        params: params ?? {},
      }),
      providesTags: ["PurchaseReceipt"],
    }),
    getPurchaseReceiptById: builder.query<ApiResponse<PurchaseReceipt>, string>(
      {
        query: (id) => `/purchasing/receipts/${id}`,
        providesTags: (_r, _e, id) => [{ type: "PurchaseReceipt", id }],
      },
    ),
    getPurchaseReceiptImages: builder.query<
      ApiResponse<PurchaseReceiptImageUrl[]>,
      string
    >({
      query: (id) => `/purchasing/receipts/${id}/images`,
    }),
    createPurchaseReceipt: builder.mutation<
      ApiResponse<PurchaseReceipt>,
      FormData
    >({
      query: (formData) => ({
        url: "/purchasing/receipts",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["PurchaseReceipt", "PurchaseRequest"],
    }),
    confirmPurchaseReceipt: builder.mutation<
      ApiResponse<PurchaseReceipt>,
      {
        id: string;
        notes?: string;
        items: Array<{
          purchaseReceiptItemId: string;
          confirmedQuantity: number;
        }>;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/purchasing/receipts/${id}/confirm`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PurchaseReceipt", "Batch", "LiveStock"],
    }),
    updatePurchaseReceipt: builder.mutation<
      ApiResponse<PurchaseReceipt>,
      {
        id: string;
        data: { receivingDate?: string; notes?: string; items?: unknown[] };
      }
    >({
      query: ({ id, data }) => ({
        url: `/purchasing/receipts/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["PurchaseReceipt"],
    }),
    cancelPurchaseReceipt: builder.mutation<
      ApiResponse<PurchaseReceipt>,
      string
    >({
      query: (id) => ({
        url: `/purchasing/receipts/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: ["PurchaseReceipt"],
    }),
  }),
});

export const {
  useGetPurchaseRequestsQuery,
  useGetPurchaseRequestByIdQuery,
  useCreatePurchaseRequestMutation,
  useUpdatePurchaseRequestMutation,
  useSubmitPurchaseRequestMutation,
  useHospitalApprovePRMutation,
  useHospitalRejectPRMutation,
  useManagerApprovePRMutation,
  useManagerRejectPRMutation,
  useCompletePurchaseRequestMutation,
  useCancelPurchaseRequestMutation,
  useGetPurchaseReceiptsQuery,
  useGetPurchaseReceiptByIdQuery,
  useGetPurchaseReceiptImagesQuery,
  useCreatePurchaseReceiptMutation,
  useConfirmPurchaseReceiptMutation,
  useUpdatePurchaseReceiptMutation,
  useCancelPurchaseReceiptMutation,
} = purchasingApi;
