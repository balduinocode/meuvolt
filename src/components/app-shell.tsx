"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Home, FileText, Package, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardTab } from "@/components/dashboard-tab";
import { QuotesTab } from "@/components/quotes-tab";
import { CatalogTab } from "@/components/catalog-tab";
import { SettingsTab } from "@/components/settings-tab";
import { NewQuoteFlow } from "@/components/new-quote-flow";
import { haptic } from "@/lib/helpers";

type Tab = "home" | "quotes" | "catalog" | "settings";

export function AppShell() {
  const { isLoaded, loadData } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [showNewQuote, setShowNewQuote] = useState(false);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!isLoaded) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (showNewQuote) {
    return (
      <NewQuoteFlow
        onClose={() => setShowNewQuote(false)}
        onComplete={() => {
          setShowNewQuote(false);
          setActiveTab("quotes");
        }}
      />
    );
  }

  const tabs = [
    { id: "home" as Tab, label: "Início", icon: Home },
    { id: "quotes" as Tab, label: "Orçamentos", icon: FileText },
    { id: "catalog" as Tab, label: "Catálogo", icon: Package },
    { id: "settings" as Tab, label: "Ajustes", icon: Settings },
  ];

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Desktop centering wrapper */}
      <div className="flex flex-1 min-h-0 justify-center">
        {/* Content */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-20 w-full max-w-2xl">
          {activeTab === "home" && <DashboardTab onNewQuote={() => setShowNewQuote(true)} onGoToQuotes={() => setActiveTab("quotes")} />}
          {activeTab === "quotes" && <QuotesTab onNewQuote={() => setShowNewQuote(true)} />}
          {activeTab === "catalog" && <CatalogTab />}
          {activeTab === "settings" && <SettingsTab />}
        </main>
      </div>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-lg safe-area-bottom">
        <div className="mx-auto flex max-w-2xl items-center justify-around">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                haptic("light");
                setActiveTab(tab.id);
              }}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 pt-3 transition-colors",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* FAB - New Quote — centered on desktop */}
      <div className="pointer-events-none fixed bottom-[72px] left-0 right-0 z-50 mx-auto flex max-w-2xl justify-end px-4">
        <button
          onClick={() => {
            haptic("medium");
            setShowNewQuote(true);
          }}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition-transform active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
