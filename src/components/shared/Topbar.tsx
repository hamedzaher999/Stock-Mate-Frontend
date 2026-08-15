import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, User, Settings, Menu } from "lucide-react";
import { Button } from "@/components/primitive/button";
import { useCurrentUser } from "@/hooks/usePermission";
import {
  useGetUnreadCountQuery,
  useMarkAllReadMutation,
  useGetNotificationsQuery,
} from "@/api/notifications.api";
import { useLogoutMutation } from "@/api/auth.api";
import { logout } from "@/features/auth/auth.slice";
import { baseApi } from "@/api/baseApi";
import { useUiStore } from "@/stores/ui.store";
import { useState } from "react";
import { formatRelative } from "@/lib/formatters";
import { useThemeStore } from "@/stores/theme.store";
function NotificationBell() {
  const { t } = useTranslation("notifications");
  const { data } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 30000,
  });
  const { data: notifData } = useGetNotificationsQuery(
    { limit: 8 },
    { pollingInterval: 30000 },
  );
  const [markAll] = useMarkAllReadMutation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const count = data?.data?.count ?? 0;
  const notifications = notifData?.data?.items ?? [];

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="size-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -inset-e-0.5 bg-danger text-white text-[9px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-1">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute inset-e-0 top-full mt-2 w-80 rounded-2xl border border-border bg-card shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold">{t("title")}</p>
            {count > 0 && (
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => markAll()}
              >
                {t("markAllRead")}
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t("empty")}
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  className="w-full text-start px-4 py-3 hover:bg-muted border-b border-border last:border-0 transition-colors"
                  onClick={() => {
                    setOpen(false);
                    navigate("/notifications");
                  }}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && (
                      <span className="mt-1.5 size-2 rounded-full bg-primary shrink-0" />
                    )}
                    <div className={n.isRead ? "ms-4" : ""}>
                      <p className="text-xs font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {n.body}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatRelative(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="p-3 border-t border-border">
            <button
              className="text-xs text-primary w-full text-center hover:underline"
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
            >
              {t("viewAll")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Topbar() {
  const { i18n } = useTranslation();
  const currentUser = useCurrentUser();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toggleMobileSidebar } = useUiStore();

  const [logoutMutation] = useLogoutMutation();

  async function handleLogout() {
    try {
      await logoutMutation().unwrap();
    } catch {}
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
    navigate("/login");
  }

  function toggleLanguage() {
    const next = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(next);
    useThemeStore.getState().setLanguage(next);
  }

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border h-14 flex items-center px-4 gap-3">
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggleMobileSidebar}
      >
        <Menu className="size-4" />
      </Button>

      <div className="flex-1" />

      {/* Language toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLanguage}
        className="text-xs font-medium"
      >
        {i18n.language === "ar" ? "EN" : "عر"}
      </Button>

      {/* Notifications */}
      <NotificationBell />

      {/* User menu */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex flex-col items-end">
          <p className="text-sm font-medium leading-none">
            {currentUser?.fullName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentUser?.role?.name}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile")}
          >
            <User className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/settings")}
          >
            <Settings className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
