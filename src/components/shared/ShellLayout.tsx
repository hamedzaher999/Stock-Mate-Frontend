import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { TooltipProvider } from "@/components/primitive/tooltip";
import AssistantWidget from "@/features/assistant/components/AssistantWidget";

export default function ShellLayout() {
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
