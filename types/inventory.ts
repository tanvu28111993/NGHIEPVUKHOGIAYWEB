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