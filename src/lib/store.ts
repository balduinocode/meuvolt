import { create } from 'zustand';
import { db, type Quote, type CatalogItem, type UserProfile, type QuoteItem } from './db';
import { v4 as uuidv4 } from 'uuid';

// Default catalog items for electricians
const defaultCatalogItems: Omit<CatalogItem, 'id'>[] = [
  { name: 'Fio 2,5mm²', price: 3.50, unit: 'metro', category: 'material', usageCount: 0, updatedAt: new Date().toISOString() },
  { name: 'Fio 4,0mm²', price: 5.20, unit: 'metro', category: 'material', usageCount: 0, updatedAt: new Date().toISOString() },
  { name: 'Fio 6,0mm²', price: 8.00, unit: 'metro', category: 'material', usageCount: 0, updatedAt: new Date().toISOString() },
  { name: 'Disjuntor 20A', price: 15.00, unit: 'un', category: 'material', usageCount: 0, updatedAt: new Date().toISOString() },
  { name: 'Disjuntor 32A', price: 18.00, unit: 'un', category: 'material', usageCount: 0, updatedAt: new Date().toISOString() },
  { name: 'Disjuntor DR 30mA', price: 85.00, unit: 'un', category: 'material', usageCount: 0, updatedAt: new Date().toISOString() },
  { name: 'Tomada 10A', price: 12.00, unit: 'un', category: 'material', usageCount: 0, updatedAt: new Date().toISOString() },
  { name: 'Tomada 20A', price: 18.00, unit: 'un', category: 'material', usageCount: 0, updatedAt: new Date().toISOString() },
  { name: 'Interruptor simples', price: 10.00, unit: 'un', category: 'material', usageCount: 0, updatedAt: new Date().toISOString() },
  { name: 'Interruptor duplo', price: 15.00, unit: 'un', category: 'material', usageCount: 0, updatedAt: new Date().toISOString() },
  { name: 'Quadro de distribuição 12 disjuntores', price: 65.00, unit: 'un', category: 'material', usageCount: 0, updatedAt: new Date().toISOString() },
  { name: 'Caixa de luz 4x2', price: 2.50, unit: 'un', category: 'material', usageCount: 0, updatedAt: new Date().toISOString() },
  { name: 'Conduíte 3/4"', price: 3.00, unit: 'metro', category: 'material', usageCount: 0, updatedAt: new Date().toISOString() },
  { name: 'Lâmpada LED 9W', price: 8.00, unit: 'un', category: 'material', usageCount: 0, updatedAt: new Date().toISOString() },
  { name: 'Mão de obra - Instalação', price: 50.00, unit: 'hora', category: 'service', usageCount: 0, updatedAt: new Date().toISOString() },
  { name: 'Mão de obra - Manutenção', price: 60.00, unit: 'hora', category: 'service', usageCount: 0, updatedAt: new Date().toISOString() },
  { name: 'Visita técnica', price: 80.00, unit: 'un', category: 'service', usageCount: 0, updatedAt: new Date().toISOString() },
  { name: 'Passagem de fiação', price: 35.00, unit: 'ponto', category: 'service', usageCount: 0, updatedAt: new Date().toISOString() },
  { name: 'Instalação de tomada', price: 45.00, unit: 'ponto', category: 'service', usageCount: 0, updatedAt: new Date().toISOString() },
  { name: 'Instalação de disjuntor', price: 40.00, unit: 'un', category: 'service', usageCount: 0, updatedAt: new Date().toISOString() },
];

const defaultProfile: UserProfile = {
  id: 'default',
  name: 'Meu Nome',
  phone: '',
  logo: '',
  quotePrefix: 'ORC',
  defaultValidity: 30,
  defaultWarranty: '90 dias',
};

interface AppState {
  quotes: Quote[];
  catalog: CatalogItem[];
  profile: UserProfile;
  isLoaded: boolean;
  
  // Actions
  loadData: () => Promise<void>;
  
  // Quotes
  addQuote: (quote: Omit<Quote, 'id' | 'number' | 'createdAt' | 'updatedAt'>) => Promise<Quote>;
  updateQuote: (id: string, data: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  duplicateQuote: (id: string) => Promise<Quote>;
  
  // Catalog
  addCatalogItem: (item: Omit<CatalogItem, 'id'>) => Promise<void>;
  updateCatalogItem: (id: string, data: Partial<CatalogItem>) => Promise<void>;
  deleteCatalogItem: (id: string) => Promise<void>;
  incrementUsage: (itemId: string) => Promise<void>;
  
  // Profile
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  quotes: [],
  catalog: [],
  profile: defaultProfile,
  isLoaded: false,
  
  loadData: async () => {
    let catalog = await db.catalog.toArray();
    if (catalog.length === 0) {
      const items = defaultCatalogItems.map(item => ({ ...item, id: uuidv4() }));
      await db.catalog.bulkAdd(items);
      catalog = items;
    }
    
    let profile = await db.profile.get('default');
    if (!profile) {
      await db.profile.add(defaultProfile);
      profile = defaultProfile;
    }
    
    const quotes = await db.quotes.orderBy('createdAt').reverse().toArray();
    
    set({ quotes, catalog, profile, isLoaded: true });
  },
  
  addQuote: async (quoteData) => {
    const quotes = get().quotes;
    const maxNumber = quotes.reduce((max, q) => Math.max(max, q.number), 0);
    const now = new Date().toISOString();
    const quote: Quote = {
      ...quoteData,
      id: uuidv4(),
      number: maxNumber + 1,
      createdAt: now,
      updatedAt: now,
    };
    await db.quotes.add(quote);
    set({ quotes: [quote, ...get().quotes] });
    return quote;
  },
  
  updateQuote: async (id, data) => {
    const updated = { ...data, updatedAt: new Date().toISOString() };
    await db.quotes.update(id, updated);
    set({ quotes: get().quotes.map(q => q.id === id ? { ...q, ...updated } : q) });
  },
  
  deleteQuote: async (id) => {
    await db.quotes.delete(id);
    set({ quotes: get().quotes.filter(q => q.id !== id) });
  },
  
  duplicateQuote: async (id) => {
    const original = get().quotes.find(q => q.id === id);
    if (!original) throw new Error('Quote not found');
    const { id: _, number: __, createdAt: ___, updatedAt: ____, ...rest } = original;
    return get().addQuote({ ...rest, status: 'draft' });
  },
  
  addCatalogItem: async (item) => {
    const newItem = { ...item, id: uuidv4() };
    await db.catalog.add(newItem);
    set({ catalog: [...get().catalog, newItem] });
  },
  
  updateCatalogItem: async (id, data) => {
    await db.catalog.update(id, data);
    set({ catalog: get().catalog.map(c => c.id === id ? { ...c, ...data } : c) });
  },
  
  deleteCatalogItem: async (id) => {
    await db.catalog.delete(id);
    set({ catalog: get().catalog.filter(c => c.id !== id) });
  },
  
  incrementUsage: async (itemId) => {
    const item = get().catalog.find(c => c.id === itemId);
    if (item) {
      const updated = { usageCount: item.usageCount + 1 };
      await db.catalog.update(itemId, updated);
      set({ catalog: get().catalog.map(c => c.id === itemId ? { ...c, ...updated } : c) });
    }
  },
  
  updateProfile: async (data) => {
    await db.profile.update('default', data);
    set({ profile: { ...get().profile, ...data } });
  },
}));
