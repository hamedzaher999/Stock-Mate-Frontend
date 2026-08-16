import {
  useGetSelectableDepartmentsQuery,
  type DeptSelectorContext,
} from "@/api/departments.api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitive/select";
import AppEmptyState from "@/components/shared/AppEmptyState";
import { Skeleton } from "@/components/primitive/skeleton";
import { Building2, Loader2 } from "lucide-react";
interface DepartmentSelectorProps {
  context: DeptSelectorContext;
  value: string;
  onChange: (id: string, name: string) => void;
  emptyMessage?: string;
}

export interface ResolvedDept {
  id: string;
  name: string;
}

export function useDepartmentSelector(context: DeptSelectorContext) {
  const { data, isLoading, isFetching } =
    useGetSelectableDepartmentsQuery(context);
  const result = data?.data;
  const scoped = result?.scoped ?? false;
  const departments = result?.departments ?? [];

  const resolved: ResolvedDept | null =
    scoped && departments.length === 1
      ? { id: departments[0].id, name: departments[0].name }
      : null;

  const noAccess = scoped && departments.length === 0;

  return { isLoading, isFetching, scoped, departments, resolved, noAccess };
}

export default function DepartmentSelector({
  context,
  value,
  onChange,
  emptyMessage,
}: DepartmentSelectorProps) {
  const { isLoading, isFetching, scoped, departments, resolved, noAccess } =
    useDepartmentSelector(context);

  if (isLoading) return <Skeleton className="h-9 w-48" />;

  if (noAccess) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="size-4" />
        <span>
          {emptyMessage ??
            "Not assigned to an eligible department for this page."}
        </span>
      </div>
    );
  }

  if (resolved) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Building2 className="size-4 text-primary" />
        <span>{resolved.name}</span>
        {isFetching && (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={value}
        onValueChange={(v) => {
          const dept = departments.find((d) => d.id === v);
          if (dept) onChange(dept.id, dept.name);
        }}
      >
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Select department..." />
        </SelectTrigger>
        <SelectContent>
          {departments.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isFetching && (
        <Loader2 className="size-4 animate-spin text-muted-foreground shrink-0" />
      )}
    </div>
  );
}

export { AppEmptyState };
