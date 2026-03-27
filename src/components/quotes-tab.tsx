"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { formatCurrency, timeAgo, getQuoteNumber, haptic, calculateSubtotal, calculateDiscount } from "@/lib/helpers";
import { Search, Plus, MoreVertical, Copy, Trash2, Send, CheckCircle2, X, FileText, Download, ExternalLink, Loader2 } from "lucide-react";
import { shareQuotePDF, openQuotePDFInTab } from "@/lib/pdf";
import { Input } from "@/components/ui/input";
import type { Quote } from "@/lib/db";

const statusConfig = {
  draft: { label: "Rascunho", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  sent: { label: "Enviado", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
  approved: { label: "Aprovado", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" },
  rejected: { label: "Rejeitado", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" },
};

const statusOrder: Quote["status"][] = ["draft", "sent", "approved", "rejected"];

export function QuotesTab({ onNewQuote }: { onNewQuote: () => void }) {
  const { quotes, profile, updateQuote, deleteQuote, duplicateQuote } = useStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<"download" | "open" | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Quote["status"] | "all">("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  const handleDownload = async (quote: Quote) => {
    setMenuOpen(null);
    setLoadingId(quote.id);
    setLoadingAction("download");
    setErrorId(null);
    try {
      await shareQuotePDF(quote, profile);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      setErrorId(quote.id);
      setTimeout(() => setErrorId(null), 3000);
    } finally {
      setLoadingId(null);
      setLoadingAction(null);
    }
  };

  const handleOpenInTab = async (quote: Quote) => {
    setMenuOpen(null);
    setLoadingId(quote.id);
    setLoadingAction("open");
    setErrorId(null);
    try {
      await openQuotePDFInTab(quote, profile);
    } catch (err) {
      console.error("Erro ao abrir PDF:", err);
      setErrorId(quote.id);
      setTimeout(() => setErrorId(null), 3000);
    } finally {
      setLoadingId(null);
      setLoadingAction(null);
    }
  };

  const filtered = quotes.filter((q) => {
    const matchSearch =
      q.clientName.toLowerCase().includes(search.toLowerCase()) ||
      getQuoteNumber(q.number, profile.quotePrefix).toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || q.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-foreground">Orçamentos</h1>
          <button
            onClick={onNewQuote}
            className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente ou número..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <FilterPill
            label="Todos"
            count={quotes.length}
            active={filterStatus === "all"}
            onClick={() => setFilterStatus("all")}
          />
          {statusOrder.map((s) => (
            <FilterPill
              key={s}
              label={statusConfig[s].label}
              count={quotes.filter((q) => q.status === s).length}
              active={filterStatus === s}
              onClick={() => setFilterStatus(s)}
            />
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 px-4 space-y-2 pb-4 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 pt-16">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhum orçamento encontrado</p>
          </div>
        )}
        {filtered.map((quote) => {
          const subtotal = calculateSubtotal(quote.items);
          const discount = calculateDiscount(subtotal, quote.discountType, quote.discountValue);
          const total = subtotal - discount;
          const st = statusConfig[quote.status];
          const isLoading = loadingId === quote.id;
          const hasError = errorId === quote.id;

          return (
            <div key={quote.id} className="relative rounded-xl border bg-card p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {quote.clientName}
                    </p>
                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {getQuoteNumber(quote.number, profile.quotePrefix)} · {quote.items.length} {quote.items.length === 1 ? "item" : "itens"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {quote.serviceType} · {timeAgo(quote.createdAt)}
                  </p>
                  {/* Loading / error feedback */}
                  {isLoading && (
                    <p className="text-xs text-primary mt-1 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {loadingAction === "download" ? "Gerando PDF..." : "Abrindo PDF..."}
                    </p>
                  )}
                  {hasError && (
                    <p className="text-xs text-destructive mt-1">Erro ao gerar PDF. Tente novamente.</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-sm font-bold text-foreground">
                    {formatCurrency(total)}
                  </p>
                  <button
                    onClick={() => setMenuOpen(menuOpen === quote.id ? null : quote.id)}
                    className="p-1 rounded-lg hover:bg-muted"
                  >
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Context Menu */}
              {menuOpen === quote.id && (
                <div className="absolute right-3 top-14 z-20 w-48 rounded-xl border bg-card py-1 shadow-xl">
                  <MenuBtn
                    icon={<Download className="h-3.5 w-3.5" />}
                    label="Baixar PDF"
                    onClick={() => handleDownload(quote)}
                  />
                  <MenuBtn
                    icon={<ExternalLink className="h-3.5 w-3.5" />}
                    label="Abrir PDF na aba"
                    onClick={() => handleOpenInTab(quote)}
                  />
                  <div className="my-1 border-t" />
                  {quote.status === "draft" && (
                    <MenuBtn
                      icon={<Send className="h-3.5 w-3.5" />}
                      label="Marcar Enviado"
                      onClick={() => {
                        updateQuote(quote.id, { status: "sent" });
                        setMenuOpen(null);
                      }}
                    />
                  )}
                  {quote.status === "sent" && (
                    <>
                      <MenuBtn
                        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                        label="Marcar Aprovado"
                        onClick={() => {
                          updateQuote(quote.id, { status: "approved" });
                          setMenuOpen(null);
                        }}
                      />
                      <MenuBtn
                        icon={<X className="h-3.5 w-3.5" />}
                        label="Marcar Rejeitado"
                        onClick={() => {
                          updateQuote(quote.id, { status: "rejected" });
                          setMenuOpen(null);
                        }}
                      />
                    </>
                  )}
                  <div className="my-1 border-t" />
                  <MenuBtn
                    icon={<Copy className="h-3.5 w-3.5" />}
                    label="Duplicar"
                    onClick={() => {
                      duplicateQuote(quote.id);
                      setMenuOpen(null);
                      haptic("success");
                    }}
                  />
                  <MenuBtn
                    icon={<FileText className="h-3.5 w-3.5 text-destructive" />}
                    label="Excluir"
                    danger
                    onClick={() => {
                      deleteQuote(quote.id);
                      setMenuOpen(null);
                      haptic("error");
                    }}
                  />
                </div>
              )}

              {/* Overlay to close menu */}
              {menuOpen === quote.id && (
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(null)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "bg-primary text-white" : "bg-muted text-muted-foreground"
      }`}
    >
      {label}
      <span className={`ml-0.5 rounded-full px-1 text-[10px] ${active ? "bg-white/20" : "bg-background"}`}>
        {count}
      </span>
    </button>
  );
}

function MenuBtn({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-muted ${
        danger ? "text-destructive" : "text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
