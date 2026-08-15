import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import AppPageHeader from "@/components/shared/AppPageHeader";
import SessionsList from "@/components/shared/SessionsList";
import { Button } from "@/components/primitive/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/primitive/dialog";
import {
  useGetMySessionsQuery,
  useRevokeMySessionMutation,
} from "@/api/sessions.api";
import { useLogoutAllMutation } from "@/api/auth.api";
import { baseApi } from "@/api/baseApi";
import { logout } from "@/features/auth/auth.slice";
export default function MySessionsPage() {
  const { t } = useTranslation("sessions");
  const { data, isLoading } = useGetMySessionsQuery();
  const [revokeSession] = useRevokeMySessionMutation();
  const [logoutAll] = useLogoutAllMutation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmLogoutAllOpen, setConfirmLogoutAllOpen] = useState(false);

  const sessions = data?.data ?? [];
  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  async function handleRevoke(sessionId: string) {
    setRevokingId(sessionId);
    try {
      await revokeSession(sessionId).unwrap();
    } finally {
      setRevokingId(null);
    }
  }

  async function handleLogoutAll() {
    try {
      await logoutAll().unwrap();
    } catch {}
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
    navigate("/login");
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <AppPageHeader
        title={t("mySessions.title")}
        subtitle={t("mySessions.subtitle")}
        actions={
          otherSessionsCount > 0 && (
            <Button
              variant="outline"
              className="text-danger border-danger/30 hover:bg-danger/5"
              onClick={() => setConfirmLogoutAllOpen(true)}
            >
              {t("mySessions.logoutAll")}
            </Button>
          )
        }
      />

      <SessionsList
        sessions={sessions}
        isLoading={isLoading}
        onRevoke={handleRevoke}
        revokingId={revokingId}
        emptyMessage={t("mySessions.empty")}
      />

      <Dialog
        open={confirmLogoutAllOpen}
        onOpenChange={setConfirmLogoutAllOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("mySessions.logoutAllTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("mySessions.logoutAllConfirm")}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmLogoutAllOpen(false)}
            >
              {t("common:actions.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleLogoutAll}>
              {t("mySessions.logoutAll")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
