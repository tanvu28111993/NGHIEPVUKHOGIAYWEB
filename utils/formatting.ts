

// Helper: Định dạng ngày giờ chuẩn hệ thống (dd/MM/yyyy HH:mm:ss)
export const formatDateTime = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${h}:${m}:${s}`;
};

// Helper: Parse chuỗi ngày giờ VN (dd/MM/yyyy HH:mm:ss) sang Timestamp
export const parseVNDateTimeToTimestamp = (dateStr: string): number => {
    if (!dateStr) return 0;
    try {
        const parts = dateStr.trim().split(' ');
        if (parts.length < 2) return 0;
        
        const dParts = parts[0].split('/');
        const tParts = parts[1].split(':');
        
        if (dParts.length !== 3 || tParts.length < 2) return 0;
        
        const day = parseInt(dParts[0], 10);
        const month = parseInt(dParts[1], 10) - 1; // JS month 0-11
        const year = parseInt(dParts[2], 10);
        
        const hour = parseInt(tParts[0], 10);
        const min = parseInt(tParts[1], 10);
        const sec = tParts[2] ? parseInt(tParts[2], 10) : 0;
        
        return new Date(year, month, day, hour, min, sec).getTime();
    } catch (e) {
        return 0;
    }
};

// Helper: Định dạng số từ Database (VD: 1200.5) sang chuẩn VN (VD: 1.200,5) để hiển thị
export const formatNumberToVN = (value: number | string | undefined): string => {
  if (value === undefined || value === null || value === '') return '';
  
  const str = String(value);
  // Nếu đã có dấu phẩy thì có thể nó đã là dạng text VN, trả về luôn
  if (str.includes(',')) return str;

  const parts = str.split('.');
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? parts[1] : '';

  // Định dạng phần nguyên: thêm dấu chấm phân cách hàng nghìn
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return decimalPart ? `${formattedInteger},${decimalPart}` : formattedInteger;
};

// Helper: Chuyển chuỗi VN (1.200,5) về số chuẩn (1200.5) để lưu DB/Tính toán
export const parseVNToNumber = (value: any): number => {
  if (!value && value !== 0) return 0;
  if (typeof value === 'number') return value;
  
  let cleanValue = String(value);
  // Xóa dấu chấm phân cách hàng nghìn
  cleanValue = cleanValue.replace(/\./g, '');
  // Chuyển dấu phẩy thành dấu chấm thập phân
  cleanValue = cleanValue.replace(/,/g, '.');
  
  const num = parseFloat(cleanValue);
  return isNaN(num) ? 0 : num;
};

// Helper: Xử lý logic input mask thông minh cho số liệu VN
// Tự động xử lý dấu chấm/phẩy khi người dùng nhập liệu
export const processNumberInput = (rawValue: string): string => {
    let val = rawValue;

    // 1. Xử lý thông minh dấu chấm (Numpad) vs Dấu phân cách hàng nghìn
    if (!val.includes(',')) {
        if (val.endsWith('.')) {
             // Người dùng gõ dấu chấm cuối cùng (VD: "12.") -> Chuyển thành phẩy thập phân
             val = val.replace(/\./g, '') + ',';
        } else {
             const parts = val.split('.');
             if (parts.length > 1) {
                 const lastPart = parts[parts.length - 1];
                 // Logic: Nếu sau dấu chấm < 3 số -> Là thập phân -> Chuyển thành phẩy
                 if (lastPart.length < 3 && lastPart.length > 0) {
                     const lastDotIndex = val.lastIndexOf('.');
                     const front = val.substring(0, lastDotIndex).replace(/\./g, '');
                     const back = val.substring(lastDotIndex + 1);
                     val = front + ',' + back;
                 } else {
                     // Nếu >= 3 số hoặc đang nhập -> Coi là phân cách hàng nghìn -> Xóa đi để format lại
                     val = val.replace(/\./g, '');
                 }
             }
        }
    } else {
        // Đã có dấu phẩy -> Xóa mọi dấu chấm
        val = val.replace(/\./g, '');
    }

    // 2. Chỉ giữ lại số và dấu phẩy
    val = val.replace(/[^0-9,]/g, '');

    // 3. Đảm bảo chỉ có tối đa 1 dấu phẩy
    const parts = val.split(',');
    if (parts.length > 2) {
      val = parts[0] + ',' + parts.slice(1).join('');
    }

    // 4. Định dạng lại phần nguyên
    const currentParts = val.split(',');
    let integerPart = currentParts[0];
    const decimalPart = currentParts.length > 1 ? currentParts[1] : null;

    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    let finalVal = integerPart;
    if (decimalPart !== null) {
        finalVal += ',' + decimalPart;
    } else if (val.endsWith(',')) {
        finalVal += ',';
    }

    return finalVal;
};
