import {
  ApiResponse,
  DisposalSaleRequest,
  DisposalSaleRequestImageUrl,
  LiveStockRow,
  PaginatedResult,
} from "@/lib/apiTypes";
import { baseApi } from "./baseApi";

export const disposalSalesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDisposalSaleLiveStock: builder.query<
      ApiResponse<PaginatedResult<LiveStockRow>>,
      { page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: "/disposal/sales/live-stock",
        params: params ?? {},
      }),
      providesTags: ["LiveStock"],
    }),
    getDisposalSaleRequests: builder.query<
      ApiResponse<PaginatedResult<DisposalSaleRequest>>,
      {
        page?: number;
        limit?: number;
        destinationId?: string;
        status?: string;
      } | void
    >({
      query: (params) => ({ url: "/disposal/sales", params: params ?? {} }),
      providesTags: ["DisposalSaleRequest"],
    }),
    getDisposalSaleRequestById: builder.query<
      ApiResponse<DisposalSaleRequest>,
      string
    >({
      query: (id) => `/disposal/sales/${id}`,
      providesTags: (_r, _e, id) => [{ type: "DisposalSaleRequest", id }],
    }),
    getDisposalSaleImages: builder.query<
      ApiResponse<DisposalSaleRequestImageUrl[]>,
      string
    >({
      query: (id) => `/disposal/sales/${id}/images`,
    }),
    createDisposalSaleRequest: builder.mutation<
      ApiResponse<DisposalSaleRequest>,
      {
        destinationId: string;
        notes?: string;
        items: Array<{
          variantId: string;
          batchId: string;
          quantity: number;
          price: number;
        }>;
      }
    >({
      query: (body) => ({ url: "/disposal/sales", method: "POST", body }),
      invalidatesTags: ["DisposalSaleRequest"],
    }),
    approveDisposalSaleRequest: builder.mutation<
      ApiResponse<DisposalSaleRequest>,
      string
    >({
      query: (id) => ({
        url: `/disposal/sales/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: ["DisposalSaleRequest"],
    }),
    rejectDisposalSaleRequest: builder.mutation<
      ApiResponse<DisposalSaleRequest>,
      { id: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/disposal/sales/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["DisposalSaleRequest"],
    }),
    cancelDisposalSaleRequest: builder.mutation<
      ApiResponse<DisposalSaleRequest>,
      string
    >({
      query: (id) => ({
        url: `/disposal/sales/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: ["DisposalSaleRequest"],
    }),
    addDisposalSaleImages: builder.mutation<
      ApiResponse<DisposalSaleRequest>,
      { id: string; formData: FormData }
    >({
      query: ({ id, formData }) => ({
        url: `/disposal/sales/${id}/images`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["DisposalSaleRequest"],
    }),
    confirmDisposalSaleRequest: builder.mutation<
      ApiResponse<DisposalSaleRequest>,
      string
    >({
      query: (id) => ({
        url: `/disposal/sales/${id}/confirm`,
        method: "POST",
      }),
      invalidatesTags: ["DisposalSaleRequest", "LiveStock"],
    }),
  }),
});
export const {
  useGetDisposalSaleLiveStockQuery,
  useGetDisposalSaleRequestsQuery,
  useGetDisposalSaleRequestByIdQuery,
  useGetDisposalSaleImagesQuery,
  useCreateDisposalSaleRequestMutation,
  useApproveDisposalSaleRequestMutation,
  useRejectDisposalSaleRequestMutation,
  useCancelDisposalSaleRequestMutation,
  useAddDisposalSaleImagesMutation,
  useConfirmDisposalSaleRequestMutation,
} = disposalSalesApi;
