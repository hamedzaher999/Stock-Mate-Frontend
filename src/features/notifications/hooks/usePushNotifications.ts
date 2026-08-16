import { useCallback, useEffect, useState } from "react";
import {
  getCurrentPermission,
  isPushSupported,
  onForegroundMessage,
  requestPushToken,
} from "@/lib/firebase";
import {
  useRegisterDeviceTokenMutation,
  useUnregisterDeviceTokenMutation,
} from "@/api/notifications.api";
import { useIsAuthenticated } from "@/hooks/usePermission";

const STORAGE_KEY = "rc-hms-push-token";
const DISMISSED_KEY = "rc-hms-push-prompt-dismissed";

export type PushUiState =
  | "unsupported"
  | "denied"
  | "not-enabled"
  | "enabling"
  | "enabled"
  | "error";

export function usePushNotifications() {
  const isAuthenticated = useIsAuthenticated();
  const [registerDeviceToken] = useRegisterDeviceTokenMutation();
  const [unregisterDeviceToken] = useUnregisterDeviceTokenMutation();

  const [state, setState] = useState<PushUiState>("not-enabled");
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    isPushSupported().then((ok) => {
      setSupported(ok);
      if (!ok) {
        setState("unsupported");
        return;
      }
      const perm = getCurrentPermission();
      if (perm === "denied") setState("denied");
      else if (perm === "granted" && localStorage.getItem(STORAGE_KEY))
        setState("enabled");
      else setState("not-enabled");
    });
  }, []);

  const enable = useCallback(async () => {
    setState("enabling");
    const result = await requestPushToken();

    if (result.status === "granted") {
      localStorage.setItem(STORAGE_KEY, result.token);
      try {
        await registerDeviceToken({
          fcmToken: result.token,
          platform: "web",
        }).unwrap();
        setState("enabled");
      } catch {
        setState("error");
      }
    } else if (result.status === "denied") {
      setState("denied");
    } else if (result.status === "unsupported") {
      setState("unsupported");
    } else {
      setState("error");
    }
  }, [registerDeviceToken]);

  const disable = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (token) {
      try {
        await unregisterDeviceToken(token).unwrap();
      } catch {
        // best-effort
      }
      localStorage.removeItem(STORAGE_KEY);
    }
    setState("not-enabled");
  }, [unregisterDeviceToken]);

  // Silent attempt after login: only if permission was already granted
  // previously (never re-prompts on its own).
  useEffect(() => {
    if (!isAuthenticated || !supported) return;
    if (getCurrentPermission() !== "granted") return;
    if (localStorage.getItem(STORAGE_KEY)) return; // already registered this session/device
    enable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, supported]);

  return { state, enable, disable, supported };
}

export function usePromptDismissed() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === "1",
  );
  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }, []);
  return { dismissed, dismiss };
}
