export type ProductStatus = 'In Stock' | 'Out of Stock' | 'Reserved';
export type ProductCondition = 'New' | 'Used - Like New' | 'Used - Good' | 'Used - Fair';
export type ProductCategory = 'Laptops' | 'New Laptops' | 'Used Laptops' | 'Prebuilt PC' | 'Accessories' | 'Spare Parts' | 'Components';

export interface Product {
  id: string;
  title: string;
  shortDescription: string;
  category: ProductCategory;
  brand: string;
  model: string;
  componentType?: string;
  
  // Specifications
  processor?: string;
  ram?: string;
  storage?: string;
  graphics?: string;
  display?: string;
  
  // Component specific
  cabinetFormFactor?: string;
  cabinetFans?: string;
  motherboardSocket?: string;
  motherboardFormFactor?: string;
  powerSupplyWattage?: string;
  powerSupplyRating?: string;
  rawSpecifications?: string;
  
  // Used items specific
  condition?: ProductCondition;
  batteryHealth?: string;
  
  // Sales info
  purchasePrice: number;
  sellingPrice: number;
  offerPrice?: number;
  quantity: number;
  sku: string;
  
  warrantyDetails?: string;
  accessoriesIncluded?: string;
  
  status: ProductStatus;
  images: string[];
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type RepairStatus = 'Received' | 'Under Diagnosis' | 'Waiting for Approval' | 'Waiting for Parts' | 'Repair in Progress' | 'Quality Check' | 'Ready for Delivery' | 'Delivered' | 'Closed';

export interface RepairLog {
  id: string;
  timestamp: Date;
  engineerName: string;
  action: string;
  partsUsed?: string[];
  additionalCost?: number;
  notes?: string;
}

export interface RepairTicket {
  id: string; // The generated ticket number
  customerId: string;
  customerName: string;
  customerPhone: string;
  
  deviceType: string;
  brand: string;
  model: string;
  serialNumber: string;
  specifications: string;
  accessoriesSubmitted: string;
  cosmeticCondition: string;
  reportedIssue: string;
  
  estimatedCharges: number;
  expectedDeliveryDate: Date;
  
  status: RepairStatus;
  logs: RepairLog[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  totalPurchases: number;
  totalRepairs: number;
  createdAt: Date;
  updatedAt: Date;
}
