"use client";

import { useStore } from "@/lib/store";
import { formatCurrency, timeAgo, getQuoteNumber, calculateSubtotal, calculateDiscount } from "@/lib/helpers";
import {
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const statusMap = {
  draft: { label: "Rascunho", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  sent: { label: "Enviado", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
  approved: { label: "Aprovado", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" },
  rejected: { label: "Rejeitado", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" },
};

export function DashboardTab({
  onNewQuote,
  onGoToQuotes,
}: {
  onNewQuote: () => void;
  onGoToQuotes: () => void;
}) {
  const { quotes, profile } = useStore();

  // Helper: calcula o total líquido (com desconto) de um orçamento
  const quoteTotal = (q: typeof quotes[0]) => {
    const sub = calculateSubtotal(q.items);
    return sub - calculateDiscount(sub, q.discountType, q.discountValue);
  };

  // Orçamentos do mês excluindo rejeitados
  const thisMonth = quotes.filter((q) => {
    if (q.status === "rejected") return false;
    const d = new Date(q.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  // Faturamento = soma dos aprovados (valor com desconto)
  const totalThisMonth = quotes
    .filter((q) => q.status === "approved")
    .reduce((sum, q) => sum + quoteTotal(q), 0);

  const approvedCount = quotes.filter((q) => q.status === "approved").length;
  const pendingCount = quotes.filter((q) => q.status === "sent").length;
  const recentQuotes = quotes.slice(0, 5);

  return (
    <div className="space-y-5 px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Olá,</p>
          <h1 className="text-xl font-bold text-foreground">{profile.name}</h1>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Zap className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* Quick Action */}
      <button
        onClick={onNewQuote}
        className="flex w-full items-center gap-3 rounded-2xl bg-primary p-4 text-white shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
          <Plus className="h-5 w-5" />
        </div>
        <div className="text-left">
          <p className="font-semibold">Novo Orçamento</p>
          <p className="text-xs text-white/80">Crie em menos de 60 segundos</p>
        </div>
        <ChevronRight className="ml-auto h-5 w-5 text-white/60" />
      </button>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<FileText className="h-4 w-4" />}
          label="Este mês"
          value={String(thisMonth.length)}
          sub="orçamentos"
          color="text-primary bg-primary/10"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Faturamento"
          value={formatCurrency(totalThisMonth)}
          sub="este mês"
          color="text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/40"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Aprovados"
          value={String(approvedCount)}
          sub="total"
          color="text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/40"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Pendentes"
          value={String(pendingCount)}
          sub="aguardando"
          color="text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/40"
        />
      </div>

      {/* Recent Quotes */}
      {recentQuotes.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recentes</h2>
            <button
              onClick={onGoToQuotes}
              className="text-xs font-medium text-primary"
            >
              Ver todos
            </button>
          </div>
          <div className="space-y-2">
            {recentQuotes.map((quote) => {
              const total = quoteTotal(quote);
              const st = statusMap[quote.status];
              return (
                <div
                  key={quote.id}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {quote.clientName}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${st.color}`}
                      >
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getQuoteNumber(quote.number, profile.quotePrefix)} · {timeAgo(quote.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(total)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {quotes.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-10">
          <FileText className="h-10 w-10 text-muted-foreground/50" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Nenhum orçamento ainda</p>
            <p className="text-xs text-muted-foreground">
              Toque no botão acima para criar o primeiro
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className={`mb-2 inline-flex items-center justify-center rounded-lg p-1.5 ${color}`}>
        {icon}
      </div>
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}
