import { useAppSelector } from "@/app/hooks";

export function usePermission(code: string): boolean {
  return useAppSelector((s) => s.auth.permissions.includes(code));
}

export function useHasAll(codes: string[]): boolean {
  return useAppSelector((s) => codes.every((c) => s.auth.permissions.includes(c)));
}

export function useHasAny(codes: string[]): boolean {
  return useAppSelector((s) => codes.some((c) => s.auth.permissions.includes(c)));
}

export function useCurrentUser() {
  return useAppSelector((s) => s.auth.currentUser);
}

export function useIsAuthenticated() {
  return useAppSelector((s) => s.auth.isAuthenticated);
}
