
import { LabelTemplate, PrintConfig, LabelElement } from '../types/label';
import { InventoryItem } from '../types/inventory';

export const PAPER_SIZES = {
  A3: { width: 297, height: 420 },
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
};

// Removed: lastUpdated, importer, pendingOut, custom_text
export const AVAILABLE_FIELDS: { key: keyof InventoryItem | 'qr_1' | 'qr_2'; label: string; example: string }[] = [
  { key: 'sku', label: 'Mã SKU', example: 'TB01A_G300_121224_0001' },
  { key: 'qr_1', label: 'QR Code 1', example: '[QR]' },
  { key: 'qr_2', label: 'QR Code 2', example: '[QR]' },
  { key: 'packetCode', label: 'Mã kiện', example: 'K001' },
  { key: 'purpose', label: 'Mục đích', example: 'Sản xuất' },
  { key: 'paperType', label: 'Loại giấy', example: 'Kraft' },
  { key: 'gsm', label: 'Định lượng', example: '300' },
  { key: 'length', label: 'Chiều dài', example: '120' },
  { key: 'width', label: 'Chiều rộng', example: '90' },
  { key: 'weight', label: 'Trọng lượng', example: '500.5' },
  { key: 'quantity', label: 'Số lượng', example: '1' },
  { key: 'supplier', label: 'Nhà cung cấp', example: 'An Hòa' },
  { key: 'manufacturer', label: 'Nhà sản xuất', example: 'Bãi Bằng' },
  { key: 'importDate', label: 'Ngày nhập', example: '01/01/2024' },
  { key: 'productionDate', label: 'Ngày SX', example: '25/12/2023' },
  { key: 'orderCustomer', label: 'Đơn hàng', example: 'DH-ABC-2024' },
  { key: 'materialCode', label: 'Mã vật tư', example: 'VT-102-X' },
  { key: 'location', label: 'Vị trí', example: 'Kho A-01-02' },
];

export const DEFAULT_TEMPLATE: LabelTemplate = {
  name: 'Tem Mặc Định (A3)',
  width: 297, // A3 Width
  height: 420, // A3 Height
  elements: [
    { id: 'el_sku', field: 'sku', label: 'Mã SKU', x: 10, y: 20, width: 277, height: 30, fontSize: 32, isBold: true, isVisible: true },
    { id: 'el_qr1', field: 'qr_1', label: 'QR 1', x: 10, y: 60, width: 100, height: 100, fontSize: 10, isBold: false, isVisible: true },
    { id: 'el_gsm', field: 'gsm', label: 'Định lượng', x: 120, y: 70, width: 160, height: 25, fontSize: 24, isBold: true, isVisible: true, suffix: ' GSM' },
    { id: 'el_w', field: 'weight', label: 'Trọng lượng', x: 120, y: 110, width: 160, height: 25, fontSize: 24, isBold: true, isVisible: true, suffix: ' KG' },
    { id: 'el_size', field: 'width', label: 'Khổ (Rộng)', x: 10, y: 180, width: 130, height: 20, fontSize: 20, isBold: false, isVisible: true, suffix: ' cm' },
    { id: 'el_len', field: 'length', label: 'Khổ (Dài)', x: 150, y: 180, width: 130, height: 20, fontSize: 20, isBold: false, isVisible: true, suffix: ' cm' }
  ]
};

export const DEFAULT_PRINT_CONFIG: PrintConfig = {
  pageSize: 'A3',
  columns: 1,
  gap: 5,
  marginTop: 10,
  marginLeft: 10
};
