
import { InventoryItem } from './inventory';

export type PageSize = 'A3' | 'A4' | 'A5';

export interface LabelElement {
  id: string;
  field: keyof InventoryItem | 'qr_1' | 'qr_2' | 'custom_text'; // Added custom_text
  label: string;
  x: number; // Percentage or px
  y: number;
  width: number;
  height: number;
  fontSize: number;
  isBold: boolean;
  isVisible: boolean;
  suffix?: string; 
}

export interface LabelTemplate {
  name: string;
  width: number; // mm
  height: number; // mm
  elements: LabelElement[];
  backgroundImage?: string; // DataURL
}

export interface PrintConfig {
  pageSize: PageSize;
  columns: number;
  gap: number; // mm
  marginTop: number; // mm
  marginLeft: number; // mm
}
