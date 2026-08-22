import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

/**
 * usePaginatedOptions
 * ----------------------------------------------------------------
 * Drives a <ComboboxSelect> off any RTK Query paginated list hook
 * (the ones that return ApiResponse<PaginatedResult<T>>). Handles:
 *  - debounced search
 *  - resetting to page 1 when the search term (or any extra param,
 *    e.g. departmentId) changes
 *  - accumulating items across pages as the user scrolls, instead
 *    of replacing them (so previously-loaded options don't disappear)
 *
 * Because the backend hard-caps `limit` at 100, pass a comfortable
 * page size (e.g. 50) — smaller pages make the "load more" scroll
 * feel more responsive without hitting the ceiling.
 *
 * USAGE
 * -----
 * const variantOptions = usePaginatedOptions({
 *   useQuery: useGetVariantsQuery,
 *   baseParams: { isActive: true },
 *   // re-fetch from page 1 whenever the department changes
 *   resetKey: form.departmentId,
 *   skip: !form.departmentId,
 *   getItems: (data) => data?.data?.items ?? [],
 *   getPage: (data) => data?.data?.page ?? 1,
 *   getTotalPages: (data) => data?.data?.totalPages ?? 1,
 *   mapOption: (v) => ({ value: v.id, label: v.variantName }),
 * });
 *
 * <ComboboxSelect
 *   value={form.variantId}
 *   onChange={(v) => setForm({ ...form, variantId: v })}
 *   {...variantOptions.comboboxProps}
 * />
 */

interface UsePaginatedOptionsArgs<TData, TItem> {
  /** An RTK Query `useXQuery` hook, e.g. useGetVariantsQuery */
  useQuery: (
    params: Record<string, unknown>,
    opts?: { skip?: boolean },
  ) => { data: TData | undefined; isFetching: boolean; isLoading: boolean };
  /** Static params merged into every request (e.g. { isActive: true }) */
  baseParams?: Record<string, unknown>;
  /** Page size per request (keep well under the server's 100 cap) */
  pageSize?: number;
  /** When this value changes, options reset and refetch from page 1 (e.g. a department filter) */
  resetKey?: string | undefined;
  skip?: boolean;
  getItems: (data: TData | undefined) => TItem[];
  getPage: (data: TData | undefined) => number;
  getTotalPages: (data: TData | undefined) => number;
  mapOption: (item: TItem) => {
    value: string;
    label: string;
    description?: string;
  };
  searchParamName?: string;
}

export function usePaginatedOptions<TData, TItem>({
  useQuery,
  baseParams = {},
  pageSize = 50,
  resetKey,
  skip,
  getItems,
  getPage,
  getTotalPages,
  mapOption,
  searchParamName = "search",
}: UsePaginatedOptionsArgs<TData, TItem>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);
  const [accumulated, setAccumulated] = useState<TItem[]>([]);

  // Reset to page 1 when search or resetKey changes.
  const lastKey = useRef<string>("");
  const currentKey = `${debouncedSearch}::${resetKey ?? ""}`;
  useEffect(() => {
    if (currentKey !== lastKey.current) {
      lastKey.current = currentKey;
      setPage(1);
      setAccumulated([]);
    }
  }, [currentKey]);

  const { data, isFetching, isLoading } = useQuery(
    {
      page,
      limit: pageSize,
      ...baseParams,
      ...(debouncedSearch ? { [searchParamName]: debouncedSearch } : {}),
    },
    { skip },
  );

  useEffect(() => {
    if (!data) return;
    const items = getItems(data);
    const currentPage = getPage(data);
    setAccumulated((prev) => (currentPage === 1 ? items : [...prev, ...items]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const totalPages = getTotalPages(data);
  const currentPage = getPage(data);
  const hasNextPage = currentPage < totalPages;

  return {
    options: accumulated.map(mapOption),
    isFetching,
    isLoading: isLoading && page === 1,
    hasNextPage,
    onLoadMore: () => setPage((p) => p + 1),
    search,
    onSearchChange: setSearch,
    /** Spread this directly into <ComboboxSelect> */
    comboboxProps: {
      options: accumulated.map(mapOption),
      isFetching,
      isLoading: isLoading && page === 1,
      hasNextPage,
      onLoadMore: () => setPage((p) => p + 1),
      search,
      onSearchChange: setSearch,
    },
  };
}
