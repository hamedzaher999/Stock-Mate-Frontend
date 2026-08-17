import { useEffect } from "react";
import { onForegroundMessage } from "@/lib/firebase";
import { usePushNotifications } from "@/features/notifications/hooks/usePushNotifications";
import { baseApi } from "@/api/baseApi";
import { useAppDispatch } from "@/app/hooks";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { TooltipProvider } from "@/components/primitive/tooltip";
import AssistantWidget from "@/features/assistant/components/AssistantWidget";

export default function ShellLayout() {
  usePushNotifications();
  const dispatch = useAppDispatch();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    onForegroundMessage((payload) => {
      dispatch(baseApi.util.invalidateTags(["Notification", "UnreadCount"]));

      if (payload.title && Notification.permission === "granted") {
        const notification = new Notification(payload.title, {
          body: payload.body,
          icon: "/icon-192.png", // adjust to whatever icon asset you have in /public
          data: payload.data,
        });
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    }).then((unsub) => {
      unsubscribe = unsub;
    });
    return () => unsubscribe?.();
  }, [dispatch]);
  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-screen-2xl mx-auto p-4 lg:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <AssistantWidget />
    </TooltipProvider>
  );
}
