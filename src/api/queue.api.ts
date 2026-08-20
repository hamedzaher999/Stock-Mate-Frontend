import { baseApi } from "./baseApi";
import type { ApiResponse, PaginatedResult, QueueEntry } from "@/lib/apiTypes";

export const queueApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getQueue: builder.query<
      ApiResponse<PaginatedResult<QueueEntry>>,
      {
        page?: number;
        limit?: number;
        departmentId?: string;
        status?: string;
        search?: string;
      } | void
    >({
      query: (params) => ({ url: "/department-queue", params: params ?? {} }),
      providesTags: ["QueueEntry"],
    }),
    getQueueEntryById: builder.query<ApiResponse<QueueEntry>, string>({
      query: (id) => `/department-queue/${id}`,
      providesTags: (_r, _e, id) => [{ type: "QueueEntry", id }],
    }),
    addToQueue: builder.mutation<
      ApiResponse<QueueEntry>,
      { departmentId: string; patientId: string }
    >({
      query: (body) => ({ url: "/department-queue", method: "POST", body }),
      invalidatesTags: ["QueueEntry"],
    }),
    releaseQueueEntry: builder.mutation<
      ApiResponse<QueueEntry>,
      { id: string; reason?: string }
    >({
      query: ({ id, reason }) => ({
        url: `/department-queue/${id}/release`,
        method: "PATCH",
        body: reason ? { reason } : {},
      }),
      invalidatesTags: ["QueueEntry"],
    }),
    removeFromQueue: builder.mutation<
      ApiResponse<QueueEntry>,
      { id: string; removedReason: string }
    >({
      query: ({ id, removedReason }) => ({
        url: `/department-queue/${id}/remove`,
        method: "PATCH",
        body: { removedReason },
      }),
      invalidatesTags: ["QueueEntry"],
    }),
    removeAllFromQueue: builder.mutation<
      ApiResponse<{ removedCount: number }>,
      { departmentId?: string; removedReason: string }
    >({
      query: ({ departmentId, removedReason }) => ({
        url: "/department-queue/remove-all",
        method: "POST",
        params: departmentId ? { departmentId } : {},
        body: { removedReason },
      }),
      invalidatesTags: ["QueueEntry"],
    }),
  }),
});

export const {
  useGetQueueQuery,
  useGetQueueEntryByIdQuery,
  useAddToQueueMutation,
  useReleaseQueueEntryMutation,
  useRemoveFromQueueMutation,
  useRemoveAllFromQueueMutation,
} = queueApi;
