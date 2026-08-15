import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { Activity, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/app/hooks";
import { useUiStore } from "@/stores/ui.store";
import { NAV_SECTIONS, type NavItem } from "@/routes/navConfig";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/primitive/tooltip";
import { Sheet, SheetContent } from "@/components/primitive/sheet";

/* ── shared inner content ─────────────────────────────────── */

function SidebarNavContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const permissions = useAppSelector((s) => s.auth.permissions);

  const canSeeItem = (item: NavItem) => {
    if (item.permission) return permissions.includes(item.permission);
    if (item.anyOf?.length)
      return item.anyOf.some((p) => permissions.includes(p));
    return true;
  };

  return (
    <>
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-border",
          collapsed && "justify-center px-2",
        )}
      >
        <div className="bg-primary/10 rounded-xl p-2 shrink-0">
          <Activity className="size-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-foreground leading-none">
              RC HMS
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hospital System
            </p>
          </div>
        )}
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {NAV_SECTIONS.map((section, si) => {
          const visibleItems = section.items.filter(canSeeItem);
          if (!visibleItems.length) return null;

          return (
            <div key={si}>
              {section.titleKey && !collapsed && (
                <p className="px-2 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t(section.titleKey)}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;

                  const link = (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/"}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          collapsed && "justify-center px-2",
                        )
                      }
                    >
                      <Icon className="size-4 shrink-0" />
                      {!collapsed && (
                        <span className="truncate">{t(item.labelKey)}</span>
                      )}
                    </NavLink>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.path}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">
                          {t(item.labelKey)}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }
                  return link;
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </>
  );
}

/* ── main component ───────────────────────────────────────── */

export default function Sidebar() {
  const {
    sidebarCollapsed,
    toggleSidebar,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useUiStore();

  return (
    <>
      {/* ── Desktop sidebar (≥ lg) ── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col shrink-0 bg-card border-e border-border transition-all duration-200 h-screen sticky top-0",
          sidebarCollapsed ? "w-16" : "w-60",
        )}
      >
        <SidebarNavContent collapsed={sidebarCollapsed} />

        {/* Collapse toggle */}
        <div className="p-2 border-t border-border">
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-full rounded-xl py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft
              className={cn(
                "size-4 transition-transform",
                sidebarCollapsed && "rotate-180",
              )}
            />
          </button>
        </div>
      </aside>

      {/* ── Mobile drawer (< lg) ── */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent
          side="left"
          className="w-72 p-0 flex flex-col gap-0 overflow-hidden"
        >
          <SidebarNavContent
            collapsed={false}
            onNavigate={() => setMobileSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
