import { baseApi } from "./baseApi";
import type {
  ApiResponse,
  PaginatedResult,
  Unit,
  Category,
  Product,
  VariantListItem,
  VariantDetail,
} from "@/lib/apiTypes";

export const catalogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Units
    getUnits: builder.query<ApiResponse<Unit[]>, void>({
      query: () => "/catalog/units",
      providesTags: ["Unit"],
    }),
    createUnit: builder.mutation<
      ApiResponse<Unit>,
      { name: string; abbreviation?: string }
    >({
      query: (body) => ({ url: "/catalog/units", method: "POST", body }),
      invalidatesTags: ["Unit"],
    }),
    updateUnit: builder.mutation<
      ApiResponse<Unit>,
      { id: string; data: { name?: string; abbreviation?: string } }
    >({
      query: ({ id, data }) => ({
        url: `/catalog/units/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Unit"],
    }),
    deleteUnit: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/catalog/units/${id}`, method: "DELETE" }),
      invalidatesTags: ["Unit"],
    }),
    // Categories
    getCategories: builder.query<ApiResponse<Category[]>, void>({
      query: () => "/catalog/categories",
      providesTags: ["Category"],
    }),
    createCategory: builder.mutation<
      ApiResponse<Category>,
      { name: string; parentCategoryId?: string }
    >({
      query: (body) => ({ url: "/catalog/categories", method: "POST", body }),
      invalidatesTags: ["Category"],
    }),
    updateCategory: builder.mutation<
      ApiResponse<Category>,
      { id: string; data: { name?: string; parentCategoryId?: string } }
    >({
      query: ({ id, data }) => ({
        url: `/catalog/categories/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Category"],
    }),
    deleteCategory: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/catalog/categories/${id}`, method: "DELETE" }),
      invalidatesTags: ["Category"],
    }),
    // Products
    getProducts: builder.query<
      ApiResponse<PaginatedResult<Product>>,
      {
        page?: number;
        limit?: number;
        categoryId?: string;
        materialType?: string;
        isActive?: boolean;
        search?: string;
      } | void
    >({
      query: (params) => ({ url: "/catalog/products", params: params ?? {} }),
      providesTags: ["Product"],
    }),
    getProductById: builder.query<ApiResponse<Product>, string>({
      query: (id) => `/catalog/products/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Product", id }],
    }),
    createProduct: builder.mutation<
      ApiResponse<Product>,
      {
        name: string;
        categoryId?: string;
        materialType: string;
        description?: string;
      }
    >({
      query: (body) => ({ url: "/catalog/products", method: "POST", body }),
      invalidatesTags: ["Product"],
    }),
    updateProduct: builder.mutation<
      ApiResponse<Product>,
      {
        id: string;
        data: Partial<{
          name: string;
          categoryId: string;
          description: string;
        }>;
      }
    >({
      query: ({ id, data }) => ({
        url: `/catalog/products/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Product"],
    }),
    updateProductStatus: builder.mutation<
      ApiResponse<Product>,
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/catalog/products/${id}/status`,
        method: "PATCH",
        body: { isActive },
      }),
      invalidatesTags: ["Product"],
    }),
    // Variants
    getVariants: builder.query<
      ApiResponse<PaginatedResult<VariantListItem>>,
      {
        page?: number;
        limit?: number;
        productId?: string;
        isActive?: boolean;
        search?: string;
      } | void
    >({
      query: (params) => ({ url: "/catalog/variants", params: params ?? {} }),
      providesTags: ["Variant"],
    }),
    getVariantById: builder.query<ApiResponse<VariantDetail>, string>({
      query: (id) => `/catalog/variants/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Variant", id }],
    }),
    createVariant: builder.mutation<
      ApiResponse<VariantDetail>,
      { productId: string; variantName: string; sku: string; unitId: string }
    >({
      query: (body) => ({ url: "/catalog/variants", method: "POST", body }),
      invalidatesTags: ["Variant"],
    }),
    updateVariant: builder.mutation<
      ApiResponse<VariantDetail>,
      { id: string; data: Partial<{ variantName: string; unitId: string }> }
    >({
      query: ({ id, data }) => ({
        url: `/catalog/variants/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Variant"],
    }),
    updateVariantStatus: builder.mutation<
      ApiResponse<VariantDetail>,
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/catalog/variants/${id}/status`,
        method: "PATCH",
        body: { isActive },
      }),
      invalidatesTags: ["Variant"],
    }),
    updateVariantSuppliers: builder.mutation<
      ApiResponse<VariantDetail>,
      {
        id: string;
        suppliers: Array<{
          supplierId: string;
          expectedPurchasePrice?: number;
          supplierProductCode?: string;
          isPreferred?: boolean;
        }>;
      }
    >({
      query: ({ id, suppliers }) => ({
        url: `/catalog/variants/${id}/suppliers`,
        method: "PUT",
        body: { suppliers },
      }),
      invalidatesTags: ["Variant"],
    }),
  }),
});

export const {
  useGetUnitsQuery,
  useCreateUnitMutation,
  useUpdateUnitMutation,
  useDeleteUnitMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUpdateProductStatusMutation,
  useGetVariantsQuery,
  useGetVariantByIdQuery,
  useCreateVariantMutation,
  useUpdateVariantMutation,
  useUpdateVariantStatusMutation,
  useUpdateVariantSuppliersMutation,
} = catalogApi;
