import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children?: ReactNode;
  /* Key giúp reset ErrorBoundary khi chuyển trang (Optional) */
  resetKey?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Cập nhật state để lần render tiếp theo hiển thị UI thay thế
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Bạn có thể log lỗi vào một service error reporting ở đây
    console.error("Uncaught error:", error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Nếu key thay đổi (người dùng chuyển menu), reset lại trạng thái lỗi
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-950/50 rounded-xl border border-red-900/30 animate-fade-in">
          <div className="bg-red-500/10 p-4 rounded-full mb-4">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">Đã xảy ra lỗi tại khu vực này</h2>
          
          <p className="text-gray-400 text-center max-w-md mb-6 text-sm">
            Hệ thống gặp sự cố khi tải nội dung. Điều này không ảnh hưởng đến dữ liệu của bạn.
            <br />
            <span className="text-red-400 italic mt-2 block text-xs font-mono bg-black/20 p-2 rounded border border-red-500/10">
              {this.state.error?.message || "Unknown Error"}
            </span>
          </p>

          <Button 
            onClick={this.handleRetry}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Thử lại ngay
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}