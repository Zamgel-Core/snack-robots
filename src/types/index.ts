export type Category = 'Gelatinas' | 'Dulces' | 'Dulces Picantes' | 'Chicles' | 'Dulces Mexicanos' | 'Gomitas Ácidas' | 'Otro';

export interface Product {
  id: string;
  name: string;
  category: Category;
  description: string;
  stock: number;
  packageCost: number;
  piecesPerPackage: number;
  costPerPiece: number;
  price: number;
  profitPerPiece: number;
  image?: string;
}

export interface SaleItem {
  productId: string;
  quantity: number;
  price: number; // Price at the time of sale
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  profit: number;
  date: string;
}

export interface Purchase {
  id: string;
  description: string;
  totalCost: number;
  date: string;
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  type: 'sales' | 'profit' | 'items' | 'custom';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}
