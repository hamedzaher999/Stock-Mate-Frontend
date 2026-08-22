import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronDown, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/primitive/input";
// import { useDebouncedValue } from "@/hooks/useDebouncedValue";

/**
 * ComboboxSelect
 * ----------------------------------------------------------------
 * Drop-in replacement for <Select> when the option list comes from a
 * paginated RTK Query endpoint (limit is capped at 100 server-side).
 *
 * Instead of fetching `{ limit: 100 }` once and truncating anything
 * beyond that, this component:
 *  - fetches page 1 on open (and on search term change, debounced)
 *  - appends subsequent pages as the user scrolls near the bottom
 *    of the list (infinite-scroll), matching AppDataTable's
 *    "Updating…" spinner language
 *  - always keeps the currently-selected option visible/labelled
 *    even if it has scrolled out of the loaded page window, via
 *    `selectedLabel`
 *
 * Visually it matches <SelectTrigger>/<SelectContent>/<SelectItem>
 * exactly (same classes) so it drops into existing forms without
 * changing the look of the page.
 *
 * USAGE
 * -----
 * const [page, setPage] = useState(1);
 * const [search, setSearch] = useState("");
 * const debounced = useDebouncedValue(search);
 * const { data, isFetching } = useGetVariantsQuery({
 *   page, limit: 50, search: debounced || undefined, isActive: true,
 * });
 *
 * <ComboboxSelect
 *   value={form.variantId}
 *   onChange={(id) => setForm({ ...form, variantId: id })}
 *   search={search}
 *   onSearchChange={(v) => { setSearch(v); setPage(1); }}
 *   options={(data?.data?.items ?? []).map(v => ({ value: v.id, label: v.variantName }))}
 *   selectedLabel={selectedVariant?.variantName}
 *   hasNextPage={(data?.data?.page ?? 1) < (data?.data?.totalPages ?? 1)}
 *   isFetching={isFetching}
 *   onLoadMore={() => setPage((p) => p + 1)}
 *   placeholder="Select variant..."
 * />
 *
 * For simpler cases (client already has the full small list, e.g.
 * units, categories) just keep using <Select> — this component is
 * only needed where the source endpoint paginates.
 */

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

export interface ComboboxSelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  /** Label for the currently selected value; falls back to searching `options`. */
  selectedLabel?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  /** Controlled search text (parent owns debouncing + refetch). */
  search: string;
  onSearchChange: (value: string) => void;
  /** True while the current page (initial or next) is being fetched. */
  isFetching?: boolean;
  /** True on the very first fetch — shows a full skeleton row instead of items. */
  isLoading?: boolean;
  /** Whether another page is available to load. */
  hasNextPage?: boolean;
  /** Called once when the sentinel at the bottom of the list scrolls into view. */
  onLoadMore?: () => void;
  emptyMessage?: string;
  loadingMoreMessage?: string;
  /** Optional: clear the value entirely (renders a "None" row at the top). */
  clearable?: boolean;
  clearLabel?: string;
}

export function ComboboxSelect({
  value,
  onChange,
  options,
  selectedLabel,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  disabled,
  className,
  search,
  onSearchChange,
  isFetching,
  isLoading,
  hasNextPage,
  onLoadMore,
  emptyMessage = "No results found.",
  loadingMoreMessage = "Loading more…",
  clearable,
  clearLabel = "None",
}: ComboboxSelectProps) {
  const [open, setOpen] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  const currentLabel =
    selectedLabel ?? options.find((o) => o.value === value)?.label;

  // Infinite scroll: observe a sentinel div at the bottom of the list.
  React.useEffect(() => {
    if (!open || !hasNextPage || !onLoadMore) return;
    const sentinel = sentinelRef.current;
    const root = listRef.current;
    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetching) {
          onLoadMore();
        }
      },
      { root, rootMargin: "48px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, hasNextPage, onLoadMore, isFetching]);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-xl border border-border bg-input px-3 py-2 text-sm shadow-sm",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <span
            className={cn(
              "truncate text-start",
              !currentLabel && "text-muted-foreground",
            )}
          >
            {currentLabel ?? placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ms-2" />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className={cn(
            "z-50 w-(--radix-popover-trigger-width) overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        >
          <div className="p-2 border-b border-border">
            <Input
              autoFocus
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              leftIcon={<Search />}
              className="h-8"
            />
          </div>

          <div ref={listRef} className="max-h-64 overflow-y-auto p-1">
            {isLoading ? (
              <div className="px-2 py-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                <span>{loadingMoreMessage}</span>
              </div>
            ) : (
              <>
                {clearable && (
                  <ComboboxRow
                    active={!value}
                    label={clearLabel}
                    muted
                    onSelect={() => {
                      onChange("");
                      setOpen(false);
                    }}
                  />
                )}

                {options.length === 0 && !isFetching && (
                  <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                    {emptyMessage}
                  </div>
                )}

                {options.map((opt) => (
                  <ComboboxRow
                    key={opt.value}
                    active={opt.value === value}
                    label={opt.label}
                    description={opt.description}
                    onSelect={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  />
                ))}

                {/* Sentinel that triggers loading the next page */}
                {hasNextPage && <div ref={sentinelRef} className="h-1" />}

                {isFetching && options.length > 0 && (
                  <div className="px-2 py-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>{loadingMoreMessage}</span>
                  </div>
                )}

                {/* Fallback manual "load more" affordance for keyboard/no-JS-observer edge cases */}
                {hasNextPage && !isFetching && onLoadMore && (
                  <button
                    type="button"
                    onClick={onLoadMore}
                    className="w-full flex items-center justify-center gap-1 rounded-xl py-1.5 text-xs text-primary hover:bg-muted transition-colors"
                  >
                    <ChevronDown className="size-3.5" />
                    Load more
                  </button>
                )}
              </>
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

function ComboboxRow({
  active,
  label,
  description,
  muted,
  onSelect,
}: {
  active: boolean;
  label: string;
  description?: string;
  muted?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-xl py-1.5 ps-2 pe-8 text-sm outline-none text-start",
        "hover:bg-muted focus:bg-muted focus:text-foreground",
        muted && "text-muted-foreground",
      )}
    >
      <span className="flex-1 min-w-0">
        <span className="block truncate">{label}</span>
        {description && (
          <span className="block truncate text-xs text-muted-foreground">
            {description}
          </span>
        )}
      </span>
      <span className="absolute inset-e-2 flex h-3.5 w-3.5 items-center justify-center">
        {active && <Check className="h-4 w-4" />}
      </span>
    </button>
  );
}
