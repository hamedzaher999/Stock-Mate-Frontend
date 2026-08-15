import { baseApi } from "./baseApi";
import type {
  ApiResponse,
  PaginatedResult,
  StockSetting,
  Batch,
  LiveStockRow,
  Adjustment,
  InventoryTransaction,
  StockCountSession,
  StockCountItem,
  CreateStockSettingResult,
} from "@/lib/apiTypes";

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Stock Settings
    getStockSettings: builder.query<
      ApiResponse<PaginatedResult<StockSetting>>,
      {
        page?: number;
        limit?: number;
        departmentId?: string;
        variantId?: string;
        isActive?: boolean;
      } | void
    >({
      query: (params) => ({ url: "/stock-settings", params: params ?? {} }),
      providesTags: ["StockSetting"],
    }),
    createStockSetting: builder.mutation<
      ApiResponse<CreateStockSettingResult>,
      {
        departmentId: string;
        items: Array<{
          variantId: string;
          storageLocation?: string;
          minimumStock?: number;
          maximumStock?: number;
        }>;
      }
    >({
      query: (body) => ({ url: "/stock-settings", method: "POST", body }),
      invalidatesTags: ["StockSetting"],
    }),
    updateStockSetting: builder.mutation<
      ApiResponse<StockSetting>,
      {
        id: string;
        data: {
          storageLocation?: string;
          minimumStock?: number;
          maximumStock?: number;
        };
      }
    >({
      query: ({ id, data }) => ({
        url: `/stock-settings/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["StockSetting"],
    }),
    updateStockSettingStatus: builder.mutation<
      ApiResponse<StockSetting>,
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/stock-settings/${id}/status`,
        method: "PATCH",
        body: { isActive },
      }),
      invalidatesTags: ["StockSetting"],
    }),
    deleteStockSetting: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/stock-settings/${id}`, method: "DELETE" }),
      invalidatesTags: ["StockSetting"],
    }),
    // Batches
    getBatches: builder.query<
      ApiResponse<PaginatedResult<Batch>>,
      {
        page?: number;
        limit?: number;
        variantId?: string;
        departmentId?: string;
      } | void
    >({
      query: (params) => ({ url: "/batches", params: params ?? {} }),
      providesTags: ["Batch"],
    }),
    getBatchById: builder.query<ApiResponse<Batch>, string>({
      query: (id) => `/batches/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Batch", id }],
    }),
    // Live Stock
    getLiveStock: builder.query<
      ApiResponse<PaginatedResult<LiveStockRow>>,
      { departmentId: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: "/inventory/department-inventory/live-stock",
        params,
      }),
      providesTags: ["LiveStock"],
    }),
    // Adjustments
    getAdjustments: builder.query<
      ApiResponse<PaginatedResult<Adjustment>>,
      {
        page?: number;
        limit?: number;
        departmentId?: string;
        variantId?: string;
        adjustmentType?: string;
      } | void
    >({
      query: (params) => ({
        url: "/inventory/adjustments",
        params: params ?? {},
      }),
      providesTags: ["Adjustment"],
    }),
    createAdjustment: builder.mutation<
      ApiResponse<Adjustment>,
      {
        variantId: string;
        departmentId: string;
        batchId: string;
        adjustmentType: string;
        quantity: number;
        notes?: string;
        stockCountSessionId?: string;
      }
    >({
      query: (body) => ({
        url: "/inventory/adjustments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Adjustment", "LiveStock", "Batch"],
    }),
    // Consumption
    recordConsumption: builder.mutation<
      ApiResponse<
        Array<{ variantId: string; batchId: string; quantity: number }>
      >,
      {
        departmentId: string;
        notes?: string;
        items: Array<{ variantId: string; quantity: number }>;
      }
    >({
      query: (body) => ({
        url: "/inventory/consumption",
        method: "POST",
        body,
      }),
      invalidatesTags: ["LiveStock", "Transaction"],
    }),
    // Transactions
    getTransactions: builder.query<
      ApiResponse<PaginatedResult<InventoryTransaction>>,
      {
        page?: number;
        limit?: number;
        departmentId?: string;
        variantId?: string;
        batchId?: string;
        transactionType?: string;
      } | void
    >({
      query: (params) => ({
        url: "/inventory/transactions",
        params: params ?? {},
      }),
      providesTags: ["Transaction"],
    }),
    // Stock Counts
    getStockCounts: builder.query<
      ApiResponse<PaginatedResult<StockCountSession>>,
      {
        page?: number;
        limit?: number;
        departmentId?: string;
        status?: string;
      } | void
    >({
      query: (params) => ({
        url: "/inventory/stock-counts",
        params: params ?? {},
      }),
      providesTags: ["StockCount"],
    }),
    getStockCountById: builder.query<ApiResponse<StockCountSession>, string>({
      query: (id) => `/inventory/stock-counts/${id}`,
      providesTags: (_r, _e, id) => [{ type: "StockCount", id }],
    }),
    createStockCount: builder.mutation<
      ApiResponse<StockCountSession>,
      { departmentId: string; countDate: string; notes?: string }
    >({
      query: (body) => ({
        url: "/inventory/stock-counts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["StockCount"],
    }),
    addStockCountItem: builder.mutation<
      ApiResponse<StockCountItem>,
      {
        sessionId: string;
        variantId: string;
        batchId: string;
        countedQuantity: number;
        notes?: string;
      }
    >({
      query: ({ sessionId, ...body }) => ({
        url: `/inventory/stock-counts/${sessionId}/items`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["StockCount"],
    }),
    updateStockCountItem: builder.mutation<
      ApiResponse<StockCountItem>,
      {
        sessionId: string;
        itemId: string;
        countedQuantity: number;
        notes?: string;
      }
    >({
      query: ({ sessionId, itemId, ...body }) => ({
        url: `/inventory/stock-counts/${sessionId}/items/${itemId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["StockCount"],
    }),
    completeStockCount: builder.mutation<
      ApiResponse<StockCountSession>,
      string
    >({
      query: (id) => ({
        url: `/inventory/stock-counts/${id}/complete`,
        method: "POST",
      }),
      invalidatesTags: ["StockCount", "LiveStock"],
    }),
  }),
});

export const {
  useGetStockSettingsQuery,
  useCreateStockSettingMutation,
  useUpdateStockSettingMutation,
  useUpdateStockSettingStatusMutation,
  useDeleteStockSettingMutation,
  useGetBatchesQuery,
  useGetBatchByIdQuery,
  useGetLiveStockQuery,
  useGetAdjustmentsQuery,
  useCreateAdjustmentMutation,
  useRecordConsumptionMutation,
  useGetTransactionsQuery,
  useGetStockCountsQuery,
  useGetStockCountByIdQuery,
  useCreateStockCountMutation,
  useAddStockCountItemMutation,
  useUpdateStockCountItemMutation,
  useCompleteStockCountMutation,
} = inventoryApi;
