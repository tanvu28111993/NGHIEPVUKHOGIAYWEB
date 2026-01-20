
export const formatNumberVN = (value: any, digits: number = 1): string => {
  if (value === null || value === undefined || value === '') return '';
  const strVal = String(value).trim();
  
  // Logic: Allow numbers like "1000", "1.000", "1,000", "1.234,56"
  // Normalize: remove dots, replace comma with dot for parsing
  const isNumeric = /^[\d.,-]+$/.test(strVal) && /\d/.test(strVal);
  
  if (isNumeric) {
    // Try straightforward parsing first if it looks standard
    let clean = strVal;
    if (strVal.includes('.') && strVal.includes(',')) {
        // format: 1.234,56 -> 1234.56
        clean = strVal.replace(/\./g, '').replace(',', '.');
    } else if (strVal.includes(',')) {
        // format: 1234,56 -> 1234.56
        clean = strVal.replace(',', '.');
    }
    // If it only has dots, it might be 1.000 (thousand) or 1.5 (decimal in English).
    // In VN context, usually dot is thousand separator if > 3 digits or consistent pattern.
    // For safety in this app context based on existing logic, we assume standard float if no comma.
    
    const num = parseFloat(clean);
    if (!isNaN(num)) {
      return num.toLocaleString('vi-VN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
    }
  }
  return strVal;
};

// Alias for cases where digits defaults might differ or logic varies slightly
export const formatVN = (val: string | number): string => {
    return formatNumberVN(val, 10).replace(/,0+$|\.0+$/, ''); // Clean trailing zeros if needed
};
