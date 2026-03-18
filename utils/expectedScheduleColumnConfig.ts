import { ColumnConfig } from '../types';
import { ExpectedScheduleItem } from '../types';
import { formatNumberToVN, formatDateTime, formatStringDateToVN } from './formatting';

export const EXPECTED_SCHEDULE_COLUMNS: ColumnConfig<ExpectedScheduleItem>[] = [
  { header: 'ĐƠN HÀNG MUA', accessor: 'purchaseOrder', width: 180, isFixed: true },
  { header: 'LOẠI VẬT TƯ', accessor: 'materialType', width: 170 },
  { header: 'MÃ NCC', accessor: 'supplierCode', width: 150 },
  { header: 'TÊN NHÀ CUNG CẤP', accessor: 'supplierName', width: 300 },
  { header: 'MÃ VẬT TƯ', accessor: 'materialCode', width: 150 },
  { header: 'TÊN VẬT TƯ', accessor: 'materialName', width: 500 },
  { header: 'ĐƠN HÀNG/ KHÁCH HÀNG', accessor: 'orderCustomer', width: 200 },
  { header: 'LOẠI KIỆN', accessor: 'packetType', width: 150 },
  { header: 'LOẠI GIẤY', accessor: 'paperType', width: 150 },
  { header: 'NHÀ SẢN XUẤT', accessor: 'manufacturer', width: 200 },
  { header: 'NGÀY MUA', accessor: 'purchaseDate', width: 150, format: (v) => formatStringDateToVN(v as string) },
  { header: 'ĐỊNH LƯỢNG', accessor: 'gsm', width: 120, isNumeric: true, format: (v) => formatNumberToVN(v as string | number) },
  { header: 'KHỔ LÔ', accessor: 'rollWidth', width: 120, isNumeric: true, format: (v) => formatNumberToVN(v as string | number) },
  { header: 'DÀI', accessor: 'length', width: 120, isNumeric: true, format: (v) => formatNumberToVN(v) },
  { header: 'RỘNG', accessor: 'width', width: 120, isNumeric: true, format: (v) => formatNumberToVN(v) },
  { header: 'SỐ LƯỢNG', accessor: 'quantity', width: 120, isNumeric: true, format: (v) => formatNumberToVN(v) },
  { header: 'ĐƠN VỊ', accessor: 'unit', width: 100 },
  { header: 'NGÀY DỰ KIẾN VỀ', accessor: 'expectedDate', width: 150, format: (v) => formatStringDateToVN(v as string) },
  { header: 'NGƯỜI NHẬP', accessor: 'importer', width: 120 },
  { header: 'CẬP NHẬT', accessor: 'lastUpdated', width: 150, format: (v) => v ? formatDateTime(new Date(v as string)) : '' },
  { header: 'TRẠNG THÁI', accessor: 'status', width: 150 },
];

export const getDefaultCellStyle = (item: ExpectedScheduleItem) => {
  return "text-gray-300 font-bold";
};
