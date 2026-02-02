import { z } from 'zod';

// Helper Regex cho ngày tháng DD/MM/YYYY
const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;

const validateDate = (dateStr: string) => {
  if (!dateStr) return true; // Cho phép rỗng nếu không required (xử lý ở schema chính)
  const match = dateStr.match(dateRegex);
  if (!match) return false;
  
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  const daysInMonth = new Date(year, month, 0).getDate();
  return day <= daysInMonth;
};

// Schema cơ bản cho Item (Input là string do mask VN)
export const inventoryItemSchema = z.object({
  sku: z.string().optional(),
  
  purpose: z.string().min(1, "Vui lòng chọn mục đích"),
  packetCode: z.string().min(1, "Vui lòng chọn mã kiện"),
  paperType: z.string().min(1, "Vui lòng chọn loại giấy"),
  gsm: z.string().min(1, "Nhập định lượng"),
  
  supplier: z.string().optional(),
  manufacturer: z.string().optional(),
  
  importDate: z.string()
    .regex(dateRegex, "Định dạng ngày sai (DD/MM/YYYY)")
    .refine(validateDate, "Ngày không tồn tại"),
    
  productionDate: z.string()
    .regex(dateRegex, "Định dạng ngày sai (DD/MM/YYYY)")
    .refine(validateDate, "Ngày không tồn tại"),

  // Các trường số (lưu dưới dạng string có format VN)
  length: z.string().optional(),
  width: z.string().optional(),
  weight: z.string().optional(),
  quantity: z.string().optional(),
  
  orderCustomer: z.string().optional(),
  materialCode: z.string().optional(),
  location: z.string().optional(),
  pendingOut: z.string().optional(),
});

export type InventoryFormValues = z.infer<typeof inventoryItemSchema>;
