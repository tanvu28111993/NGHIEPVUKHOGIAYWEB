import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

export const PaperLocationManager: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900">
          <Loader2 className="w-12 h-12 text-brand-red animate-spin mb-4" />
          <p className="text-slate-400 animate-pulse">Đang tải bản đồ kho...</p>
        </div>
      )}

      <div className={`flex-1 bg-slate-900/50 overflow-hidden relative transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        <iframe 
          title="QKL GIẤY VI TRI" 
          width="100%" 
          height="100%" 
          src="https://app.powerbi.com/view?r=eyJrIjoiYTZhNDY3YmItMjgzOC00ZTU3LTg4MDQtZmZkMjE3MDBiMWFlIiwidCI6ImI4YjEyY2UxLTk2NDAtNDg3OC04YWE3LWFkMmY1NDlmNzljZSIsImMiOjEwfQ%3D%3D&pageName=050c64902e76542390e3&navContentPaneEnabled=false" 
          frameBorder="0" 
          allowFullScreen={true}
          className="absolute inset-0 w-full h-[calc(100%+37px)]"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
};
