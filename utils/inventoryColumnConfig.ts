import { InventoryItem, ColumnConfig } from '../types';

// MICRO-OPTIMIZATION: Cache Intl.NumberFormat instance
// Tránh khởi tạo lại formatter cho hàng nghìn cell dữ liệu
const numberFormatter = new Intl.NumberFormat('vi-VN');

// Hàm helper để định dạng số
const formatNumber = (val: any) => {
    const num = Number(val);
    return !isNaN(num) ? numberFormatter.format(num) : val;
};

// Hàm helper lấy màu sắc dựa trên loại giao dịch (Ưu tiên cao nhất)
export const getTransactionStyle = (item: InventoryItem) => {
     if (item.transactionType === 'EXPORT') return 'text-orange-500 font-bold';
     if (item.transactionType === 'IMPORT') return 'text-green-500 font-bold';
     return '';
};

export const INVENTORY_COLUMNS: ColumnConfig<InventoryItem>[] = [
    { 
        header: 'THẺ KHO GIẤY SKU', accessor: 'sku', width: 220, 
        getCellStyle: (item, isOdd, isPending) => {
             // Ưu tiên hiển thị lịch sử
             const transStyle = getTransactionStyle(item);
             if (transStyle) return transStyle;
             
             if (isPending) return 'text-green-500 font-bold';
             if (isOdd) return 'text-orange-500 font-bold';
             return 'text-blue-400 font-bold group-hover:text-blue-300';
        }
    },
    { header: 'MỤC ĐÍCH', accessor: 'purpose', width: 130 },
    { header: 'KIỆN GIẤY', accessor: 'packetCode', width: 130 },
    { header: 'LOẠI GIẤY', accessor: 'paperType', width: 130 },
    { 
        header: 'Định Lượng', accessor: 'gsm', width: 150, isFixed: false 
    },
    { header: 'NHÀ CUNG CẤP', accessor: 'supplier', width: 150 },
    { header: 'NHÀ SX', accessor: 'manufacturer', width: 120 },
    { header: 'NGÀY NHẬP', accessor: 'importDate', width: 130, isNumeric: true },
    { header: 'NGÀY SX', accessor: 'productionDate', width: 130, isNumeric: true },
    { 
        header: 'LÔ/DÀI (CM)', accessor: 'length', width: 130, isNumeric: true,
        format: formatNumber
    },
    { 
        header: 'RỘNG (CM)', accessor: 'width', width: 130, isNumeric: true,
        format: formatNumber
    },
    { 
        header: 'TRỌNG LƯỢNG', accessor: 'weight', width: 150, isNumeric: true,
        format: formatNumber
    },
    { 
        header: 'SỐ LƯỢNG', accessor: 'quantity', width: 130, isNumeric: true,
        format: formatNumber,
        getCellStyle: (item, isOdd, isPending) => {
             const transStyle = getTransactionStyle(item);
             if (transStyle) return transStyle;
             
             if (isPending) return 'text-green-500 font-bold';
             if (isOdd) return 'text-orange-500 font-bold';
             return 'text-white font-bold';
        }
    },
    { header: 'ĐƠN HÀNG/ KHÁCH HÀNG', accessor: 'orderCustomer', width: 250 },
    { header: 'MÃ VẬT TƯ', accessor: 'materialCode', width: 150 },
    { 
        header: 'VỊ TRÍ HÀNG', accessor: 'location', width: 150,
        getCellStyle: (item, isOdd, isPending) => {
             const transStyle = getTransactionStyle(item);
             if (transStyle) return transStyle;

             if (isPending) return 'text-green-500 font-bold';
             if (isOdd) return 'text-orange-500 font-bold';
             return 'text-brand-red font-bold group-hover:text-red-400';
        }
    },
    { header: 'VẬT TƯ CHỜ XUẤT', accessor: 'pendingOut', width: 200 },
    { header: 'NGƯỜI NHẬP', accessor: 'importer', width: 150 },
    { header: 'CẬP NHẬT', accessor: 'lastUpdated', width: 160 }
];

// Hàm lấy style mặc định nếu cột không định nghĩa style riêng
export const getDefaultCellStyle = (isOddLot: boolean, isPendingOut: boolean) => {
    // Logic mặc định cho Tồn Kho
    if (isPendingOut) return 'text-green-500 font-bold';
    if (isOddLot) return 'text-orange-500 font-bold';
    return 'text-gray-300 font-bold';
};