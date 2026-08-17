import { ApiResponse, Destination, PaginatedResult } from "@/lib/apiTypes";
import { baseApi } from "./baseApi";

export const destinationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDestinations: builder.query<
      ApiResponse<PaginatedResult<Destination>>,
      {
        page?: number;
        limit?: number;
        isActive?: boolean;
        search?: string;
      } | void
    >({
      query: (params) => ({ url: "/destinations", params: params ?? {} }),
      providesTags: ["Destination"],
    }),
    getDestinationById: builder.query<ApiResponse<Destination>, string>({
      query: (id) => `/destinations/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Destination", id }],
    }),
    createDestination: builder.mutation<
      ApiResponse<Destination>,
      { name: string; phone?: string; email?: string; address?: string }
    >({
      query: (body) => ({ url: "/destinations", method: "POST", body }),
      invalidatesTags: ["Destination"],
    }),
    updateDestination: builder.mutation<
      ApiResponse<Destination>,
      {
        id: string;
        data: Partial<{
          name: string;
          phone: string;
          email: string;
          address: string;
        }>;
      }
    >({
      query: ({ id, data }) => ({
        url: `/destinations/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Destination"],
    }),
    updateDestinationStatus: builder.mutation<
      ApiResponse<Destination>,
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/destinations/${id}/status`,
        method: "PATCH",
        body: { isActive },
      }),
      invalidatesTags: ["Destination"],
    }),
  }),
});

export const {
  useGetDestinationsQuery,
  useGetDestinationByIdQuery,
  useCreateDestinationMutation,
  useUpdateDestinationMutation,
  useUpdateDestinationStatusMutation,
} = destinationsApi;
