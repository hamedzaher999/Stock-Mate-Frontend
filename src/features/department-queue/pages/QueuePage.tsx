import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Clock, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import {
  useGetQueueQuery,
  useAddToQueueMutation,
  useReleaseQueueEntryMutation,
  useRemoveFromQueueMutation,
  useRemoveAllFromQueueMutation,
} from "@/api/queue.api";
import { useSelectPatientMutation } from "@/api/visits.api";
import { usePermission, useCurrentUser } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/permissions";
import DepartmentSelector, {
  useDepartmentSelector,
} from "@/components/shared/DepartmentSelector";
import { Button } from "@/components/primitive/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/primitive/dialog";
import { Label } from "@/components/primitive/label";
import { Textarea } from "@/components/primitive/textarea";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/primitive/tabs";
import { Card, CardContent } from "@/components/primitive/card";
import StatusBadge from "@/components/shared/StatusBadge";
import AppPageHeader from "@/components/shared/AppPageHeader";
import AppEmptyState from "@/components/shared/AppEmptyState";
import { Skeleton } from "@/components/primitive/skeleton";
import { formatRelative } from "@/lib/formatters";
import type { Patient, QueueEntry } from "@/lib/apiTypes";
import { useTranslation } from "react-i18next";
import PatientQuickFindPanel from "@/components/shared/PatientQuickFindPanel";
import AppErrorState from "@/components/shared/AppErrorState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitive/select";
export default function QueuePage() {
  const { t } = useTranslation("queue");
  const navigate = useNavigate();
  const canManage = usePermission(PERMISSIONS.MANAGE_DEPARTMENT_QUEUE);
  const canStartConsultation = usePermission(PERMISSIONS.START_CONSULTATION);
  const currentUser = useCurrentUser();

  const [deptId, setDeptId] = useState("");
  const [deptName, setDeptName] = useState("");
  const {
    resolved,
    noAccess,
    isLoading: deptLoading,
  } = useDepartmentSelector("queue");

  useEffect(() => {
    if (resolved && !deptId) {
      setDeptId(resolved.id);
      setDeptName(resolved.name);
    }
  }, [resolved, deptId]);

  const [tab, setTab] = useState<"live" | "history">("live");

  const {
    data: liveData,
    isLoading: liveLoading,
    isFetching: liveFetching,
    isError: liveError,
    refetch: refetchLive,
  } = useGetQueueQuery(
    { departmentId: deptId },
    { skip: !deptId, pollingInterval: 30000 },
  );
  const {
    data: historyData,
    isLoading: historyLoading,
    isFetching: historyFetching,
    isError: historyError,
    refetch: refetchHistory,
  } = useGetQueueQuery(
    { departmentId: deptId, status: "completed,removed" },
    { skip: !deptId || tab !== "history" },
  );

  const [addToQueue, { isLoading: addingToQueue }] = useAddToQueueMutation();
  const [selectPatient] = useSelectPatientMutation();
  const [releaseEntry] = useReleaseQueueEntryMutation();
  const [removeFromQueue] = useRemoveFromQueueMutation();

  const [addOpen, setAddOpen] = useState(false);
  const [addDeptId, setAddDeptId] = useState("");
  const [addDeptName, setAddDeptName] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);

  const [releaseTarget, setReleaseTarget] = useState<QueueEntry | null>(null);
  const [releaseReason, setReleaseReason] = useState("");

  const [removeTarget, setRemoveTarget] = useState<QueueEntry | null>(null);
  const [removeReason, setRemoveReason] = useState("");
  const [removeAllOpen, setRemoveAllOpen] = useState(false);
  const [removeAllScope, setRemoveAllScope] = useState<"current" | "all">(
    "current",
  );
  const [removeAllReason, setRemoveAllReason] = useState("");
  const [removeAllFromQueue, { isLoading: removingAll }] =
    useRemoveAllFromQueueMutation();
  const liveEntries = liveData?.data?.items ?? [];
  const historyEntries = historyData?.data?.items ?? [];

  function openAddDialog() {
    setAddDeptId(deptId);
    setAddDeptName(deptName);
    setSelectedPatient(null);
    setAddError(null);
    setAddSuccess(false);
    setAddOpen(true);
  }

  async function handleAdd() {
    if (!selectedPatient) {
      setAddError(t("selectPatientError"));
      return;
    }
    if (!addDeptId) {
      setAddError(t("selectDepartmentError"));
      return;
    }
    setAddError(null);
    try {
      await addToQueue({
        departmentId: addDeptId,
        patientId: selectedPatient.id,
      }).unwrap();
      setAddSuccess(true);
      setSelectedPatient(null);
    } catch (e: unknown) {
      setAddError(
        (e as { data?: { message?: string } })?.data?.message ?? "Error",
      );
    }
  }

  function addAnother() {
    setAddSuccess(false);
    setSelectedPatient(null);
    setAddError(null);
  }

  async function handleSelect(entry: QueueEntry) {
    try {
      await selectPatient({ queueEntryId: entry.id }).unwrap();
      navigate("/consultation");
    } catch {
      // ignore — error handled server-side
    }
  }

  async function handleRelease() {
    if (!releaseTarget) return;
    await releaseEntry({
      id: releaseTarget.id,
      reason: releaseReason || undefined,
    }).unwrap();
    setReleaseTarget(null);
    setReleaseReason("");
  }

  async function handleRemove() {
    if (!removeTarget || removeReason.length < 3) return;
    await removeFromQueue({
      id: removeTarget.id,
      removedReason: removeReason,
    }).unwrap();
    setRemoveTarget(null);
    setRemoveReason("");
  }
  async function handleRemoveAll() {
    if (removeAllReason.length < 3) return;
    await removeAllFromQueue({
      departmentId: removeAllScope === "current" ? deptId : undefined,
      removedReason: removeAllReason,
    }).unwrap();
    setRemoveAllOpen(false);
    setRemoveAllReason("");
    setRemoveAllScope("current");
  }
  function EntryRow({ entry }: { entry: QueueEntry }) {
    const canRelease =
      entry.status === "in_consultation" &&
      (entry.lockedById === currentUser?.id || canManage);
    const canRemoveEntry =
      (entry.status === "waiting" || entry.status === "in_consultation") &&
      canManage;

    return (
      <div className="flex items-center justify-between py-3 border-b border-border last:border-0 gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {entry.patient?.fullName}
          </p>
          <p className="text-xs text-muted-foreground">
            {entry.patient?.patientId}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatRelative(entry.addedAt)}
          </p>
          {entry.lockedBy && (
            <p className="text-xs text-info mt-0.5">
              {t("with", { name: entry.lockedBy.fullName })}
            </p>
          )}
        </div>
        <StatusBadge status={entry.status} domain="queue" />
        <div className="flex items-center gap-2 shrink-0">
          {entry.status === "waiting" && canStartConsultation && (
            <Button size="sm" onClick={() => handleSelect(entry)}>
              {t("select")}
            </Button>
          )}
          {canRelease && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setReleaseTarget(entry)}
            >
              {t("release")}
            </Button>
          )}
          {canRemoveEntry && (
            <Button
              size="sm"
              variant="outline"
              className="text-danger border-danger/30 hover:bg-danger/5"
              onClick={() => setRemoveTarget(entry)}
            >
              {t("remove")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  function renderEntryList(
    entries: QueueEntry[],
    listLoading: boolean,
    listFetching: boolean,
    listError: boolean,
    onRetryList: () => void,
    emptyText: string,
  ) {
    if (listLoading) {
      return (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      );
    }

    if (listError && entries.length === 0) {
      return <AppErrorState onRetry={onRetryList} />;
    }

    if (entries.length === 0 && !listFetching) {
      return (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {emptyText}
        </p>
      );
    }

    const showOverlay = listFetching && !listLoading;

    return (
      <div className="relative">
        <div
          className={
            showOverlay
              ? "pointer-events-none opacity-60 transition-opacity duration-150"
              : "transition-opacity duration-150"
          }
        >
          {entries.length === 0 ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-4 divide-y divide-border">
                {entries.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
        {showOverlay && (
          <div className="absolute inset-0 flex items-start justify-center pt-8">
            <div className="flex items-center gap-2 rounded-full bg-card border border-border shadow-md px-3 py-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              <span>
                {t("common:table.updating", { defaultValue: "Updating…" })}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (deptLoading)
    return (
      <div className="p-6">
        <Skeleton className="h-48 w-full" />
      </div>
    );

  if (noAccess) {
    return (
      <div>
        <AppPageHeader title={t("title")} />
        <AppEmptyState title={t("noAccessTitle")} description={t("noAccess")} />
      </div>
    );
  }

  return (
    <div>
      <AppPageHeader
        title={t("title")}
        subtitle={t("autoRefresh")}
        actions={
          <div className="flex items-center gap-3">
            <DepartmentSelector
              context="queue"
              value={deptId}
              onChange={(id, name) => {
                setDeptId(id);
                setDeptName(name);
              }}
            />
            {canManage && (
              <Button
                variant="outline"
                className="text-danger border-danger/30 hover:bg-danger/5"
                onClick={() => {
                  setRemoveAllScope("current");
                  setRemoveAllReason("");
                  setRemoveAllOpen(true);
                }}
              >
                <Trash2 className="size-4" />
                {t("removeAll")}
              </Button>
            )}
            {canManage && (
              <Button onClick={openAddDialog}>
                <UserPlus className="size-4" />
                {t("addToQueue")}
              </Button>
            )}
          </div>
        }
      />

      {!deptId && (
        <p className="text-sm text-muted-foreground">{t("selectDepartment")}</p>
      )}

      {deptId && (
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "live" | "history")}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="live" className="flex items-center gap-1">
              <Clock className="size-3" /> {t("live")}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1">
              <CheckCircle2 className="size-3" /> {t("history")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live">
            {renderEntryList(
              liveEntries,
              liveLoading,
              liveFetching,
              liveError,
              refetchLive,
              t("queueEmpty"),
            )}
          </TabsContent>

          <TabsContent value="history">
            {renderEntryList(
              historyEntries,
              historyLoading,
              historyFetching,
              historyError,
              refetchHistory,
              t("noHistory"),
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Add to Queue Dialog — fast lookup style, like Dispense Queue */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("addToQueue")}</DialogTitle>
          </DialogHeader>

          {addSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <div className="rounded-full bg-success/10 p-3">
                <CheckCircle2 className="size-8 text-success" />
              </div>
              <p className="text-sm font-medium">
                {t("quickFind.addedToQueue")}
              </p>
              <p className="text-xs text-muted-foreground">{addDeptName}</p>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" onClick={() => setAddOpen(false)}>
                  {t("common:actions.close")}
                </Button>
                <Button onClick={addAnother}>
                  <UserPlus className="size-4" />
                  {t("quickFind.addAnother")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <Label required>{t("department")}</Label>
                <DepartmentSelector
                  context="queue"
                  value={addDeptId}
                  onChange={(id, name) => {
                    setAddDeptId(id);
                    setAddDeptName(name);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label required>{t("quickFind.findPatient")}</Label>
                <PatientQuickFindPanel
                  onSelect={setSelectedPatient}
                  selectedPatientId={selectedPatient?.id}
                />
              </div>

              {selectedPatient && (
                <div className="rounded-xl bg-success/10 border border-success/30 px-3 py-2 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-success shrink-0" />
                  <p className="text-xs">
                    {t("quickFind.selected", {
                      name: selectedPatient.fullName,
                    })}
                  </p>
                </div>
              )}

              {addError && <p className="text-xs text-danger">{addError}</p>}
            </div>
          )}

          {!addSuccess && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                {t("common:actions.cancel")}
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!selectedPatient || !addDeptId}
                loading={addingToQueue}
              >
                {t("addToQueue")}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Release Dialog */}
      <Dialog
        open={!!releaseTarget}
        onOpenChange={(v) => !v && setReleaseTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("releaseTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>{t("releaseReason")}</Label>
            <Textarea
              value={releaseReason}
              onChange={(e) => setReleaseReason(e.target.value)}
              placeholder={t("releaseReasonPlaceholder")}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReleaseTarget(null)}>
              + {t("common:actions.cancel")}
            </Button>
            <Button onClick={handleRelease}>Release</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Dialog */}
      <Dialog
        open={!!removeTarget}
        onOpenChange={(v) => !v && setRemoveTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("removeTitle")}</DialogTitle>{" "}
          </DialogHeader>
          <div className="space-y-1.5">
            <Label required>{t("removeReason")}</Label>
            <Textarea
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              placeholder={t("removeReasonPlaceholder")}
              rows={3}
            />
            {removeReason.length > 0 && removeReason.length < 3 && (
              <p className="text-xs text-danger">{t("removeReasonMin")}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              {t("common:actions.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={removeReason.length < 3}
            >
              {t("remove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Remove All Dialog */}
      <Dialog open={removeAllOpen} onOpenChange={setRemoveAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("removeAllTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label required>{t("removeAllScope")}</Label>
              <Select
                value={removeAllScope}
                onValueChange={(v) => setRemoveAllScope(v as "current" | "all")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current" disabled={!deptId}>
                    {t("removeAllScopeCurrent", { name: deptName || "—" })}
                  </SelectItem>
                  <SelectItem value="all">{t("removeAllScopeAll")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label required>{t("removeReason")}</Label>
              <Textarea
                value={removeAllReason}
                onChange={(e) => setRemoveAllReason(e.target.value)}
                placeholder={t("removeReasonPlaceholder")}
                rows={3}
              />
              {removeAllReason.length > 0 && removeAllReason.length < 3 && (
                <p className="text-xs text-danger">{t("removeReasonMin")}</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground bg-warning/10 rounded-xl px-3 py-2">
              {t("removeAllWarning", {
                defaultValue:
                  "This will remove every waiting or in-consultation patient from the selected scope. This action cannot be undone.",
              })}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveAllOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveAll}
              loading={removingAll}
              disabled={removeAllReason.length < 3}
            >
              {t("removeAll")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
