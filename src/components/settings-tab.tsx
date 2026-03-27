"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { haptic } from "@/lib/helpers";
import {
  User,
  Phone,
  FileText,
  Shield,
  Palette,
  Download,
  Upload,
  Trash2,
  Moon,
  ChevronRight,
} from "lucide-react";

export function SettingsTab() {
  const { profile, updateProfile, quotes, catalog } = useStore();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [prefix, setPrefix] = useState(profile.quotePrefix);
  const [validity, setValidity] = useState(String(profile.defaultValidity));
  const [warranty, setWarranty] = useState(profile.defaultWarranty);
  const [isDark, setIsDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      quotePrefix: prefix.trim() || "ORC",
      defaultValidity: parseInt(validity) || 30,
      defaultWarranty: warranty.trim(),
    });
    haptic("success");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleDarkMode = () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      setIsDark(false);
    } else {
      html.classList.add("dark");
      setIsDark(true);
    }
    haptic("light");
  };

  const handleExport = () => {
    const data = JSON.stringify({ quotes, catalog, profile }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eletricista-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    haptic("success");
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-xl font-bold text-foreground">Ajustes</h1>

      {/* Profile Section */}
      <Section title="Perfil">
        <Field label="Seu Nome" icon={<User className="h-4 w-4" />}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: João Eletricista"
            className="rounded-xl"
          />
        </Field>
        <Field label="Telefone" icon={<Phone className="h-4 w-4" />}>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            className="rounded-xl"
          />
        </Field>
      </Section>

      {/* Quote Defaults */}
      <Section title="Padrões do Orçamento">
        <Field label="Prefixo" icon={<FileText className="h-4 w-4" />}>
          <Input
            value={prefix}
            onChange={(e) => setPrefix(e.target.value.toUpperCase())}
            placeholder="ORC"
            className="rounded-xl w-24"
            maxLength={5}
          />
        </Field>
        <Field label="Validade (dias)" icon={<Shield className="h-4 w-4" />}>
          <Input
            type="number"
            value={validity}
            onChange={(e) => setValidity(e.target.value)}
            className="rounded-xl w-20"
          />
        </Field>
        <Field label="Garantia padrão" icon={<Shield className="h-4 w-4" />}>
          <Input
            value={warranty}
            onChange={(e) => setWarranty(e.target.value)}
            placeholder="90 dias"
            className="rounded-xl"
          />
        </Field>
      </Section>

      {/* Appearance */}
      <Section title="Aparência">
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <Moon className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium">Modo Escuro</span>
          </div>
          <Switch checked={isDark} onCheckedChange={toggleDarkMode} />
        </div>
      </Section>

      {/* Data */}
      <Section title="Dados">
        <button
          onClick={handleExport}
          className="flex w-full items-center gap-3 py-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/40">
            <Download className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <span className="text-sm font-medium">Exportar Backup (JSON)</span>
          <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
        </button>
      </Section>

      <Button onClick={handleSave} className="w-full rounded-xl h-11">
        {saved ? "Salvo!" : "Salvar Alterações"}
      </Button>

      <p className="text-center text-[11px] text-muted-foreground">
        Eletricista App v1.0 · Dados salvos localmente
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
        {title}
      </h2>
      <div className="space-y-3 rounded-xl border bg-card p-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="flex flex-1 items-center justify-between gap-2">
        <label className="text-sm font-medium whitespace-nowrap">{label}</label>
        {children}
      </div>
    </div>
  );
}
