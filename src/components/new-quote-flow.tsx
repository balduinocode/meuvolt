"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  formatCurrency,
  formatPhone,
  formatCep,
  haptic,
  calculateSubtotal,
  calculateDiscount,
  getQuoteNumber,
} from "@/lib/helpers";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  MapPin,
  Package,
  CreditCard,
  FileCheck,
  Plus,
  Minus,
  Trash2,
  Search,
  X,
  Home,
  Building2,
  Factory,
  Zap,
  Wrench,
  ShieldCheck,
  Percent,
  DollarSign,
} from "lucide-react";
import type { QuoteItem } from "@/lib/db";

interface NewQuoteFlowProps {
  onClose: () => void;
  onComplete: () => void;
}

const steps = [
  { id: 1, label: "Cliente", icon: User },
  { id: 2, label: "Local", icon: MapPin },
  { id: 3, label: "Itens", icon: Package },
  { id: 4, label: "Pagamento", icon: CreditCard },
  { id: 5, label: "Revisão", icon: FileCheck },
];

const serviceTypes = [
  "Instalação elétrica",
  "Manutenção",
  "Troca de fiação",
  "Quadro de distribuição",
  "Iluminação",
  "Tomadas e interruptores",
  "Projeto elétrico",
  "Laudo técnico",
  "Outro",
];

const paymentOptions = [
  "PIX",
  "Dinheiro",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Transferência",
  "Boleto",
  "Cheque",
];

export function NewQuoteFlow({ onClose, onComplete }: NewQuoteFlowProps) {
  const { catalog, profile, addQuote, incrementUsage } = useStore();
  const [step, setStep] = useState(1);

  // Step 1: Client
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  // Step 2: Location
  const [clientCep, setClientCep] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [locationType, setLocationType] = useState<"house" | "commercial" | "industrial">("house");
  const [serviceType, setServiceType] = useState(serviceTypes[0]);

  // Step 3: Items
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [itemSearch, setItemSearch] = useState("");

  // Step 4: Payment & conditions
  const [paymentMethods, setPaymentMethods] = useState<string[]>(["PIX"]);
  const [discountType, setDiscountType] = useState<"none" | "percent" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState(0);
  const [deadline, setDeadline] = useState("");
  const [warranty, setWarranty] = useState(profile.defaultWarranty);
  const [observations, setObservations] = useState("");

  const subtotal = calculateSubtotal(items);
  const discount = calculateDiscount(subtotal, discountType, discountValue);
  const total = subtotal - discount;

  const canNext = () => {
    switch (step) {
      case 1: return clientName.trim().length > 0;
      case 2: return serviceType.length > 0;
      case 3: return items.length > 0;
      case 4: return paymentMethods.length > 0;
      case 5: return true;
      default: return false;
    }
  };

  const handleFinish = async () => {
    const quote = await addQuote({
      clientName: clientName.trim(),
      clientPhone,
      clientCep,
      clientAddress: clientAddress.trim(),
      locationType,
      serviceType,
      items,
      paymentMethods,
      discountType,
      discountValue,
      deadline: deadline.trim(),
      warranty: warranty.trim(),
      observations: observations.trim(),
      photos: [],
      status: "draft",
    });

    // Increment usage for catalog items
    for (const item of items) {
      const catalogItem = catalog.find((c) => c.name === item.name);
      if (catalogItem) {
        await incrementUsage(catalogItem.id);
      }
    }

    haptic("success");
    onComplete();
  };

  const addItemFromCatalog = (catalogItem: { name: string; price: number; unit: string; category: "material" | "service"; id?: string }) => {
    const existing = items.find((i) => i.name === catalogItem.name);
    if (existing) {
      setItems(
        items.map((i) =>
          i.name === catalogItem.name ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setItems([
        ...items,
        {
          id: crypto.randomUUID(),
          name: catalogItem.name,
          quantity: 1,
          unit: catalogItem.unit,
          unitPrice: catalogItem.price,
          category: catalogItem.category,
        },
      ]);
    }
    haptic("light");
  };

  const updateItemQty = (id: string, delta: number) => {
    setItems(
      items
        .map((i) => (i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
    haptic("light");
  };

  const filteredCatalog = catalog
    .filter((c) => c.name.toLowerCase().includes(itemSearch.toLowerCase()))
    .sort((a, b) => b.usageCount - a.usageCount);

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Top Bar */}
      <div className="flex items-center gap-3 border-b px-4 py-3 mx-auto w-full max-w-2xl">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
          className="p-1"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            {steps[step - 1].label}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Passo {step} de 5
          </p>
        </div>
        <button onClick={onClose} className="text-xs text-muted-foreground">
          Cancelar
        </button>
      </div>

      {/* Progress */}
      <div className="flex gap-1 px-4 py-2 mx-auto w-full max-w-2xl">
        {steps.map((s) => (
          <div
            key={s.id}
            className={`h-1 flex-1 rounded-full transition-colors ${
              s.id <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-4 no-scrollbar">
        <div className="mx-auto w-full max-w-2xl px-4">
        {step === 1 && (
          <StepClient
            clientName={clientName}
            setClientName={setClientName}
            clientPhone={clientPhone}
            setClientPhone={setClientPhone}
          />
        )}
        {step === 2 && (
          <StepLocation
            clientCep={clientCep}
            setClientCep={setClientCep}
            clientAddress={clientAddress}
            setClientAddress={setClientAddress}
            locationType={locationType}
            setLocationType={setLocationType}
            serviceType={serviceType}
            setServiceType={setServiceType}
          />
        )}
        {step === 3 && (
          <StepItems
            items={items}
            updateItemQty={updateItemQty}
            removeItem={removeItem}
            subtotal={subtotal}
            showPicker={showItemPicker}
            setShowPicker={setShowItemPicker}
            itemSearch={itemSearch}
            setItemSearch={setItemSearch}
            filteredCatalog={filteredCatalog}
            addItemFromCatalog={addItemFromCatalog}
          />
        )}
        {step === 4 && (
          <StepPayment
            paymentMethods={paymentMethods}
            setPaymentMethods={setPaymentMethods}
            discountType={discountType}
            setDiscountType={setDiscountType}
            discountValue={discountValue}
            setDiscountValue={setDiscountValue}
            deadline={deadline}
            setDeadline={setDeadline}
            warranty={warranty}
            setWarranty={setWarranty}
            observations={observations}
            setObservations={setObservations}
            subtotal={subtotal}
            discount={discount}
            total={total}
          />
        )}
        {step === 5 && (
          <StepReview
            clientName={clientName}
            clientPhone={clientPhone}
            clientAddress={clientAddress}
            locationType={locationType}
            serviceType={serviceType}
            items={items}
            paymentMethods={paymentMethods}
            subtotal={subtotal}
            discount={discount}
            discountType={discountType}
            discountValue={discountValue}
            total={total}
            deadline={deadline}
            warranty={warranty}
            observations={observations}
            prefix={profile.quotePrefix}
            quotesCount={useStore.getState().quotes.length}
          />
        )}
        </div>{/* end max-w-2xl */}
      </div>

      {/* Footer */}
      <div className="border-t bg-background p-4">
        <div className="mx-auto w-full max-w-2xl">
          {step < 5 ? (
            <Button
              onClick={() => {
                haptic("light");
                setStep(step + 1);
              }}
              disabled={!canNext()}
              className="w-full rounded-xl h-12 text-base"
            >
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              className="w-full rounded-xl h-12 text-base bg-green-600 hover:bg-green-700"
            >
              <Check className="mr-2 h-4 w-4" />
              Criar Orçamento
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 1
function StepClient({
  clientName,
  setClientName,
  clientPhone,
  setClientPhone,
}: {
  clientName: string;
  setClientName: (v: string) => void;
  clientPhone: string;
  setClientPhone: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Dados do Cliente</h2>
        <p className="text-sm text-muted-foreground">
          Informe o nome e contato do cliente
        </p>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Nome do Cliente *
          </label>
          <Input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Ex: Maria Silva"
            className="rounded-xl h-11"
            autoFocus
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Telefone
          </label>
          <Input
            value={clientPhone}
            onChange={(e) => setClientPhone(formatPhone(e.target.value))}
            placeholder="(11) 99999-9999"
            className="rounded-xl h-11"
            inputMode="tel"
          />
        </div>
      </div>
    </div>
  );
}

// Step 2
function StepLocation({
  clientCep,
  setClientCep,
  clientAddress,
  setClientAddress,
  locationType,
  setLocationType,
  serviceType,
  setServiceType,
}: {
  clientCep: string;
  setClientCep: (v: string) => void;
  clientAddress: string;
  setClientAddress: (v: string) => void;
  locationType: "house" | "commercial" | "industrial";
  setLocationType: (v: "house" | "commercial" | "industrial") => void;
  serviceType: string;
  setServiceType: (v: string) => void;
}) {
  const locationTypes = [
    { id: "house" as const, label: "Residencial", icon: Home },
    { id: "commercial" as const, label: "Comercial", icon: Building2 },
    { id: "industrial" as const, label: "Industrial", icon: Factory },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Local e Serviço</h2>
        <p className="text-sm text-muted-foreground">
          Onde será realizado o serviço?
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Tipo de Local
        </label>
        <div className="grid grid-cols-3 gap-2">
          {locationTypes.map((lt) => (
            <button
              key={lt.id}
              onClick={() => setLocationType(lt.id)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-colors ${
                locationType === lt.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input text-muted-foreground"
              }`}
            >
              <lt.icon className="h-5 w-5" />
              <span className="text-[11px] font-medium">{lt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Tipo de Serviço *
        </label>
        <div className="flex flex-wrap gap-2">
          {serviceTypes.map((st) => (
            <button
              key={st}
              onClick={() => setServiceType(st)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                serviceType === st
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input text-muted-foreground"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          CEP
        </label>
        <Input
          value={clientCep}
          onChange={(e) => setClientCep(formatCep(e.target.value))}
          placeholder="00000-000"
          className="rounded-xl h-11"
          inputMode="numeric"
          maxLength={9}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Endereço
        </label>
        <Input
          value={clientAddress}
          onChange={(e) => setClientAddress(e.target.value)}
          placeholder="Rua, número, bairro..."
          className="rounded-xl h-11"
        />
      </div>
    </div>
  );
}

// Step 3
function StepItems({
  items,
  updateItemQty,
  removeItem,
  subtotal,
  showPicker,
  setShowPicker,
  itemSearch,
  setItemSearch,
  filteredCatalog,
  addItemFromCatalog,
}: {
  items: QuoteItem[];
  updateItemQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  subtotal: number;
  showPicker: boolean;
  setShowPicker: (v: boolean) => void;
  itemSearch: string;
  setItemSearch: (v: string) => void;
  filteredCatalog: { id: string; name: string; price: number; unit: string; category: "material" | "service" }[];
  addItemFromCatalog: (item: { name: string; price: number; unit: string; category: "material" | "service" }) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Itens do Orçamento</h2>
          <p className="text-sm text-muted-foreground">
            Adicione materiais e serviços
          </p>
        </div>
      </div>

      {/* Add button */}
      <button
        onClick={() => setShowPicker(true)}
        className="flex w-full items-center gap-2 rounded-xl border-2 border-dashed border-primary/30 p-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
      >
        <Plus className="h-4 w-4" />
        Adicionar do Catálogo
      </button>

      {/* Items list */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-xl border bg-card p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(item.unitPrice)} / {item.unit}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateItemQty(item.id, -1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center text-sm font-medium">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateItemQty(item.id, 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <div className="text-right ml-1">
                <p className="text-sm font-semibold">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </p>
                <button onClick={() => removeItem(item.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-xl bg-primary/10 p-3">
            <span className="text-sm font-medium text-primary">Subtotal</span>
            <span className="text-base font-bold text-primary">
              {formatCurrency(subtotal)}
            </span>
          </div>
        </div>
      )}

      {/* Catalog picker overlay */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <button onClick={() => setShowPicker(false)} className="p-1">
              <X className="h-5 w-5" />
            </button>
            <span className="font-semibold">Adicionar Item</span>
          </div>
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Buscar no catálogo..."
                className="pl-9 rounded-xl"
                autoFocus
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 space-y-1 pb-4">
            {filteredCatalog.map((c) => {
              const inCart = items.find((i) => i.name === c.name);
              return (
                <button
                  key={c.id}
                  onClick={() => addItemFromCatalog(c)}
                  className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      c.category === "material"
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                        : "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                    }`}
                  >
                    {c.category === "material" ? (
                      <Package className="h-3.5 w-3.5" />
                    ) : (
                      <Wrench className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(c.price)} / {c.unit}
                    </p>
                  </div>
                  {inCart && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-white">
                      {inCart.quantity}x
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="border-t p-4">
            <Button
              onClick={() => setShowPicker(false)}
              className="w-full rounded-xl h-11"
            >
              Concluir ({items.length} {items.length === 1 ? "item" : "itens"})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Step 4
function StepPayment({
  paymentMethods,
  setPaymentMethods,
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  deadline,
  setDeadline,
  warranty,
  setWarranty,
  observations,
  setObservations,
  subtotal,
  discount,
  total,
}: {
  paymentMethods: string[];
  setPaymentMethods: (v: string[]) => void;
  discountType: "none" | "percent" | "fixed";
  setDiscountType: (v: "none" | "percent" | "fixed") => void;
  discountValue: number;
  setDiscountValue: (v: number) => void;
  deadline: string;
  setDeadline: (v: string) => void;
  warranty: string;
  setWarranty: (v: string) => void;
  observations: string;
  setObservations: (v: string) => void;
  subtotal: number;
  discount: number;
  total: number;
}) {
  const togglePayment = (method: string) => {
    if (paymentMethods.includes(method)) {
      setPaymentMethods(paymentMethods.filter((m) => m !== method));
    } else {
      setPaymentMethods([...paymentMethods, method]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Condições</h2>
        <p className="text-sm text-muted-foreground">
          Defina pagamento, prazo e garantia
        </p>
      </div>

      {/* Payment methods */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Formas de Pagamento *
        </label>
        <div className="flex flex-wrap gap-2">
          {paymentOptions.map((p) => (
            <button
              key={p}
              onClick={() => togglePayment(p)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                paymentMethods.includes(p)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input text-muted-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Discount */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Desconto
        </label>
        <div className="flex gap-2 mb-2">
          {[
            { id: "none" as const, label: "Nenhum" },
            { id: "percent" as const, label: "%", icon: Percent },
            { id: "fixed" as const, label: "R$", icon: DollarSign },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setDiscountType(d.id);
                if (d.id === "none") setDiscountValue(0);
              }}
              className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                discountType === d.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input text-muted-foreground"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        {discountType !== "none" && (
          <Input
            type="number"
            value={discountValue || ""}
            onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
            placeholder={discountType === "percent" ? "Ex: 10" : "Ex: 100"}
            className="rounded-xl"
            step="0.01"
          />
        )}
      </div>

      {/* Summary */}
      <div className="rounded-xl bg-muted p-3 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Desconto</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold border-t border-border pt-1 mt-1">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Deadline & Warranty */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Prazo de Execução
          </label>
          <Input
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            placeholder="Ex: 5 dias"
            className="rounded-xl"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Garantia
          </label>
          <Input
            value={warranty}
            onChange={(e) => setWarranty(e.target.value)}
            placeholder="Ex: 90 dias"
            className="rounded-xl"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Observações
        </label>
        <textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder="Informações adicionais..."
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none"
        />
      </div>
    </div>
  );
}

// Step 5
function StepReview({
  clientName,
  clientPhone,
  clientAddress,
  locationType,
  serviceType,
  items,
  paymentMethods,
  subtotal,
  discount,
  discountType,
  discountValue,
  total,
  deadline,
  warranty,
  observations,
  prefix,
  quotesCount,
}: {
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  locationType: string;
  serviceType: string;
  items: QuoteItem[];
  paymentMethods: string[];
  subtotal: number;
  discount: number;
  discountType: string;
  discountValue: number;
  total: number;
  deadline: string;
  warranty: string;
  observations: string;
  prefix: string;
  quotesCount: number;
}) {
  const locationLabels: Record<string, string> = {
    house: "Residencial",
    commercial: "Comercial",
    industrial: "Industrial",
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Revisão do Orçamento</h2>
        <p className="text-sm text-muted-foreground">
          Confira os dados antes de criar
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-4">
        <div className="text-center border-b pb-3">
          <p className="text-xs text-muted-foreground">Orçamento</p>
          <p className="text-lg font-bold text-primary">
            {getQuoteNumber(quotesCount + 1, prefix)}
          </p>
        </div>

        <ReviewSection title="Cliente">
          <p className="text-sm font-medium">{clientName}</p>
          {clientPhone && <p className="text-xs text-muted-foreground">{clientPhone}</p>}
          {clientAddress && <p className="text-xs text-muted-foreground">{clientAddress}</p>}
        </ReviewSection>

        <ReviewSection title="Serviço">
          <p className="text-sm font-medium">{serviceType}</p>
          <p className="text-xs text-muted-foreground">{locationLabels[locationType]}</p>
        </ReviewSection>

        <ReviewSection title="Itens">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm py-0.5">
              <span className="text-muted-foreground">
                {item.quantity}x {item.name}
              </span>
              <span className="font-medium">
                {formatCurrency(item.quantity * item.unitPrice)}
              </span>
            </div>
          ))}
        </ReviewSection>

        <div className="rounded-lg bg-muted p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Desconto</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t pt-1 mt-1">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        <ReviewSection title="Pagamento">
          <p className="text-sm">{paymentMethods.join(", ")}</p>
        </ReviewSection>

        {(deadline || warranty) && (
          <ReviewSection title="Condições">
            {deadline && <p className="text-sm">Prazo: {deadline}</p>}
            {warranty && <p className="text-sm">Garantia: {warranty}</p>}
          </ReviewSection>
        )}

        {observations && (
          <ReviewSection title="Observações">
            <p className="text-sm text-muted-foreground">{observations}</p>
          </ReviewSection>
        )}
      </div>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider mb-1">
        {title}
      </p>
      {children}
    </div>
  );
}
