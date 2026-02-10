
import React, { useRef } from 'react';
import { InventoryItem } from '../../../types';
import { useLabelStore } from '../../../stores/labelStore';
import { Button } from '../../UI/Button';
import { Printer, X, LayoutTemplate } from 'lucide-react';

interface PrintPreviewProps {
  items: InventoryItem[];
  onClose: () => void;
}

export const PrintPreview: React.FC<PrintPreviewProps> = ({ items, onClose }) => {
  const { template, printConfig, setPrintConfig } = useLabelStore();
  const printRef = useRef<HTMLDivElement>(null);

  // Sử dụng trực tiếp kích thước từ Template thiết kế
  const paperWidth = template.width;
  const paperHeight = template.height;
  
  const handlePrint = () => {
      const content = printRef.current?.innerHTML;
      if (!content) return;

      const printWindow = window.open('', '', 'width=1000,height=800');
      if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>In Tem Kho Giấy</title>
                <style>
                  @page { 
                    /* Thiết lập khổ giấy in theo đúng kích thước thiết kế */
                    size: ${paperWidth}mm ${paperHeight}mm; 
                    margin: 0; 
                  }
                  body { 
                    margin: 0; 
                    font-family: Arial, sans-serif; 
                    background: white;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  .print-page {
                    width: ${paperWidth}mm;
                    height: ${paperHeight}mm;
                    padding-top: ${printConfig.marginTop}mm;
                    padding-left: ${printConfig.marginLeft}mm;
                    box-sizing: border-box;
                    page-break-after: always;
                    position: relative;
                    overflow: hidden;
                  }
                  .label-item {
                    display: inline-block;
                    position: relative;
                    vertical-align: top;
                    overflow: hidden;
                  }
                  .label-text {
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      text-align: center;
                      line-height: 1.2;
                  }
                  img {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  @media print {
                     .label-item { border: none; }
                     body { -webkit-print-color-adjust: exact; }
                  }
                </style>
              </head>
              <body>
                ${content}
                <script>
                   // Đợi load xong và delay thêm 500ms để đảm bảo ảnh QR render kịp trên Chrome
                   window.onload = function() { 
                      setTimeout(function() {
                        window.print(); 
                        window.close(); 
                      }, 500);
                   }
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
      }
  };

  const generateQRCodeUrl = (data: string) => {
       // Tăng kích thước lên 1000x1000 và khử margin để in sắc nét nhất
       return `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=0&data=${encodeURIComponent(data)}`;
  };

  // Tính toán scale để hiển thị vừa màn hình nếu khổ quá to
  const previewScale = paperWidth > 200 ? 0.6 : 1; 

  return (
    <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="p-4 bg-slate-900 border-b border-gray-800 flex justify-between items-center">
            <div className="flex gap-6 items-center">
                {/* Hiển thị thông tin khổ giấy đang dùng (Read-only) */}
                <div className="flex items-center gap-2 text-blue-400 bg-blue-900/20 px-3 py-1.5 rounded border border-blue-500/30">
                    <LayoutTemplate className="w-4 h-4" />
                    <span className="text-sm font-bold">
                        Khổ thiết kế: {paperWidth} x {paperHeight} mm
                    </span>
                </div>
                
                <div className="h-6 w-px bg-gray-700"></div>

                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span>Số cột:</span>
                    <input 
                        type="number" min="1" max="10"
                        value={printConfig.columns}
                        onChange={(e) => setPrintConfig({ columns: Number(e.target.value) })}
                        className="w-14 h-8 bg-slate-800 border border-gray-600 rounded px-2 text-center focus:border-blue-500 focus:outline-none"
                    />
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span>Khoảng cách (mm):</span>
                    <input 
                        type="number" min="0"
                        value={printConfig.gap}
                        onChange={(e) => setPrintConfig({ gap: Number(e.target.value) })}
                        className="w-14 h-8 bg-slate-800 border border-gray-600 rounded px-2 text-center focus:border-blue-500 focus:outline-none"
                    />
                </div>
            </div>

            <div className="flex gap-2">
                <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5 mr-1" /> Đóng
                </Button>
                <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-900/20">
                    <Printer className="w-4 h-4 mr-2" /> TIẾN HÀNH IN
                </Button>
            </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-gray-800/80 p-8 overflow-auto flex justify-center custom-scrollbar">
            <div 
                ref={printRef}
                className="bg-white shadow-2xl origin-top transition-transform"
                style={{
                    width: `${paperWidth}mm`,
                    minHeight: `${paperHeight}mm`,
                    paddingTop: `${printConfig.marginTop}mm`,
                    paddingLeft: `${printConfig.marginLeft}mm`,
                    transform: `scale(${previewScale})`,
                    marginBottom: '100px' // Extra space for scroll
                }}
            >
                {/* Render Items */}
                {items.map((item, idx) => (
                    <div 
                        key={idx}
                        className="label-item"
                        style={{
                            width: `${template.width}mm`,
                            height: `${template.height}mm`,
                            marginRight: `${(idx + 1) % printConfig.columns === 0 ? 0 : printConfig.gap}mm`,
                            marginBottom: `${printConfig.gap}mm`,
                            backgroundImage: template.backgroundImage ? `url(${template.backgroundImage})` : 'none',
                            backgroundSize: 'cover'
                        }}
                    >
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            {template.elements.map(el => {
                                if (!el.isVisible) return null;
                                
                                let content = '';
                                if (el.field === 'custom_text') {
                                    // Custom text logic: Sử dụng trực tiếp label từ thiết kế
                                    content = el.label;
                                } else if (el.field.includes('qr')) {
                                     // QR Code Rendering
                                     const qrData = el.field === 'qr_2' ? item.sku : item.sku; 
                                     return (
                                        <img 
                                            key={el.id}
                                            src={generateQRCodeUrl(qrData)}
                                            alt="QR"
                                            loading="eager" // Quan trọng: Tải ngay lập tức để kịp in
                                            style={{
                                                position: 'absolute',
                                                left: `${el.x / template.width * 100}%`,
                                                top: `${el.y / template.height * 100}%`,
                                                width: `${el.width / template.width * 100}%`,
                                                height: `${el.height / template.height * 100}%`,
                                                objectFit: 'contain'
                                            }}
                                        />
                                     );
                                } else {
                                    // Field logic: Lấy từ dữ liệu kho
                                    // @ts-ignore
                                    content = item[el.field] ? String(item[el.field]) : '';
                                }

                                return (
                                    <div 
                                        key={el.id}
                                        className="label-text"
                                        style={{
                                            position: 'absolute',
                                            left: `${el.x / template.width * 100}%`,
                                            top: `${el.y / template.height * 100}%`,
                                            width: `${el.width / template.width * 100}%`,
                                            fontSize: `${el.fontSize}pt`, // Sử dụng pt cho in ấn chính xác hơn px
                                            fontWeight: el.isBold ? 'bold' : 'normal',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {content}{el.suffix}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};
