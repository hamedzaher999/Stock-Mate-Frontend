import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";

export function getErrorStatus(
  error: FetchBaseQueryError | SerializedError | undefined,
): number | string | undefined {
  if (!error) return undefined;
  if ("status" in error) return error.status as number | string;
  return undefined;
}
