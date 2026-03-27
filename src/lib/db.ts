import Dexie, { type EntityTable } from 'dexie';

export interface CatalogItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: 'material' | 'service';
  usageCount: number;
  updatedAt: string;
}

export interface QuoteItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  category: 'material' | 'service';
}

export interface Quote {
  id: string;
  number: number;
  clientName: string;
  clientPhone: string;
  clientCep: string;
  clientAddress: string;
  locationType: 'house' | 'commercial' | 'industrial';
  serviceType: string;
  items: QuoteItem[];
  paymentMethods: string[];
  discountType: 'none' | 'percent' | 'fixed';
  discountValue: number;
  deadline: string;
  warranty: string;
  observations: string;
  photos: string[];
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  logo: string;
  quotePrefix: string;
  defaultValidity: number;
  defaultWarranty: string;
}

const db = new Dexie('ElectricistaDB') as Dexie & {
  quotes: EntityTable<Quote, 'id'>;
  catalog: EntityTable<CatalogItem, 'id'>;
  profile: EntityTable<UserProfile, 'id'>;
};

db.version(1).stores({
  quotes: 'id, number, clientName, status, createdAt',
  catalog: 'id, name, category, usageCount',
  profile: 'id',
});

export { db };
