import { baseApi } from "./baseApi";
import type {
  ApiResponse,
  PaginatedResult,
  DisposalTransfer,
  DisposalCandidates,
} from "@/lib/apiTypes";

export const disposalApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDisposalCandidates: builder.query<
      ApiResponse<DisposalCandidates>,
      string
    >({
      query: (departmentId) =>
        `/disposal/departments/${departmentId}/candidates`,
      providesTags: ["DisposalTransfer"],
    }),
    getDisposalTransfers: builder.query<
      ApiResponse<PaginatedResult<DisposalTransfer>>,
      {
        page?: number;
        limit?: number;
        departmentId?: string;
        status?: string;
      } | void
    >({
      query: (params) => ({ url: "/disposal/transfers", params: params ?? {} }),
      providesTags: ["DisposalTransfer"],
    }),
    getDisposalTransferById: builder.query<
      ApiResponse<DisposalTransfer>,
      string
    >({
      query: (id) => `/disposal/transfers/${id}`,
      providesTags: (_r, _e, id) => [{ type: "DisposalTransfer", id }],
    }),
    initiateDisposalTransfer: builder.mutation<
      ApiResponse<DisposalTransfer>,
      { departmentId: string }
    >({
      query: ({ departmentId }) => ({
        url: `/disposal/transfers/departments/${departmentId}`,
        method: "POST",
      }),
      invalidatesTags: ["DisposalTransfer"],
    }),
    confirmDisposalTransfer: builder.mutation<
      ApiResponse<DisposalTransfer>,
      {
        id: string;
        notes?: string;
        items: Array<{
          disposalTransferItemId: string;
          confirmedQuantity: number;
        }>;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/disposal/transfers/${id}/confirm`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["DisposalTransfer", "LiveStock"],
    }),
    cancelDisposalTransfer: builder.mutation<
      ApiResponse<DisposalTransfer>,
      { id: string; reason?: string }
    >({
      query: ({ id, reason }) => ({
        url: `/disposal/transfers/${id}/cancel`,
        method: "POST",
        body: reason ? { reason } : {},
      }),
      invalidatesTags: ["DisposalTransfer", "LiveStock"],
    }),
  }),
});

export const {
  useGetDisposalCandidatesQuery,
  useGetDisposalTransfersQuery,
  useGetDisposalTransferByIdQuery,
  useInitiateDisposalTransferMutation,
  useConfirmDisposalTransferMutation,
  useCancelDisposalTransferMutation,
} = disposalApi;
