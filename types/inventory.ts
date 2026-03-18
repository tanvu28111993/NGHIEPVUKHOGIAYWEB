
export interface ExpectedScheduleItem {
  id: string;
  materialType: string;
  purchaseDate: string;
  purchaseOrder: string;
  supplierCode: string;
  supplierName: string;
  materialCode?: string;
  materialName: string;
  orderCustomer: string;
  packetType: string;
  paperType: string;
  manufacturer: string;
  gsm: string;
  rollWidth: string;
  length: number;
  width: number;
  quantity: number;
  unit: string;
  expectedDate: string;
  importer: string;
  lastUpdated: string;
  status: string;
  statusColor?: string;
}

export interface InventoryItem {
  sku: string;           
  purpose: string;       
  packetCode: string;    
  paperType: string;     
  gsm: string;           
  supplier: string;      
  manufacturer: string;  
  importDate: string;    
  productionDate: string;
  length: number;        
  width: number;         
  weight: number;        
  quantity: number;      
  orderCustomer: string; 
  materialCode: string;  
  location: string;      
  pendingOut: string;    
  importer: string;      
  lastUpdated: string;
  transactionType?: 'IMPORT' | 'EXPORT'; // Phân loại lịch sử
}

// --- Workflow Types (Moved from hooks) ---

export interface ExportInputItem {
  id: string;
  sku: string;
  exportQty: string;
}

export interface ExportStagingItem extends InventoryItem {
  exportQty: number;
  exportWeight: number;
}

export interface ReImportInputItem {
  id: string;
  sku: string;
  reImportQty: string;
  reImportWeight: string; 
}

export interface ReImportStagingItem extends InventoryItem {
  reImportQty: number;
  reImportWeight: number;
}
