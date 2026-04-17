import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Đã xảy ra sự cố</h1>
              <p className="text-gray-500 text-sm mb-6">
                Hệ thống gặp một lỗi không mong muốn trong quá trình render giao diện. Vui lòng thử tải lại trang hoặc báo cáo cho quản trị viên nếu lỗi tiếp tục.
              </p>
              
              {/* Optional: Show brief error stack in development or for debug */}
              <div className="bg-gray-50 p-4 rounded-xl text-left overflow-hidden">
                <p className="text-xs font-mono text-red-400 truncate">
                  {this.state.error?.message?.toString()}
                </p>
              </div>
            </div>
            
            <button 
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors"
            >
              <RefreshCw size={18} />
              Tải lại ứng dụng
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
