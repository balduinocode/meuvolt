"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { formatCurrency, haptic } from "@/lib/helpers";
import {
  Search,
  Plus,
  Package,
  Wrench,
  Edit3,
  Trash2,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { CatalogItem } from "@/lib/db";

export function CatalogTab() {
  const { catalog, addCatalogItem, updateCatalogItem, deleteCatalogItem } =
    useStore();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<"all" | "material" | "service">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formUnit, setFormUnit] = useState("un");
  const [formCategory, setFormCategory] = useState<"material" | "service">("material");

  const filtered = catalog
    .filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === "all" || c.category === filterCat;
      return matchSearch && matchCat;
    })
    .sort((a, b) => b.usageCount - a.usageCount);

  const materialCount = catalog.filter((c) => c.category === "material").length;
  const serviceCount = catalog.filter((c) => c.category === "service").length;

  const openForm = (item?: CatalogItem) => {
    if (item) {
      setEditingItem(item);
      setFormName(item.name);
      setFormPrice(String(item.price));
      setFormUnit(item.unit);
      setFormCategory(item.category);
    } else {
      setEditingItem(null);
      setFormName("");
      setFormPrice("");
      setFormUnit("un");
      setFormCategory("material");
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formPrice) return;
    const data = {
      name: formName.trim(),
      price: parseFloat(formPrice),
      unit: formUnit,
      category: formCategory,
      usageCount: editingItem?.usageCount || 0,
      updatedAt: new Date().toISOString(),
    };
    if (editingItem) {
      await updateCatalogItem(editingItem.id, data);
    } else {
      await addCatalogItem(data);
    }
    setShowForm(false);
    haptic("success");
  };

  const units = ["un", "metro", "m²", "hora", "ponto", "diária", "kg", "peça"];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-foreground">Catálogo</h1>
          <button
            onClick={() => openForm()}
            className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>

        <div className="flex gap-2">
          <FilterPill label="Todos" count={catalog.length} active={filterCat === "all"} onClick={() => setFilterCat("all")} />
          <FilterPill label="Materiais" count={materialCount} active={filterCat === "material"} onClick={() => setFilterCat("material")} />
          <FilterPill label="Serviços" count={serviceCount} active={filterCat === "service"} onClick={() => setFilterCat("service")} />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 px-4 space-y-2 pb-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-xl border bg-card p-3"
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                item.category === "material"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                  : "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
              }`}
            >
              {item.category === "material" ? (
                <Package className="h-4 w-4" />
              ) : (
                <Wrench className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {item.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(item.price)} / {item.unit}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => openForm(item)}
                className="p-1.5 rounded-lg hover:bg-muted"
              >
                <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button
                onClick={() => {
                  deleteCatalogItem(item.id);
                  haptic("error");
                }}
                className="p-1.5 rounded-lg hover:bg-muted"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-t-2xl bg-background p-5 pb-8 space-y-4 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingItem ? "Editar Item" : "Novo Item"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Fio 2,5mm²"
                  className="rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Preço (R$)</label>
                  <Input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="0,00"
                    className="rounded-xl"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Unidade</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Categoria</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormCategory("material")}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                      formCategory === "material"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-muted-foreground"
                    }`}
                  >
                    Material
                  </button>
                  <button
                    onClick={() => setFormCategory("service")}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                      formCategory === "service"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-muted-foreground"
                    }`}
                  >
                    Serviço
                  </button>
                </div>
              </div>
            </div>

            <Button onClick={handleSave} className="w-full rounded-xl h-11">
              {editingItem ? "Salvar Alterações" : "Adicionar ao Catálogo"}
            </Button>
          </div>
        </div>
      )}
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
