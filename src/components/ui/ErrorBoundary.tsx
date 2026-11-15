import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'An unexpected rendering error occurred.' };
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border-2 border-[#222222] p-8 manga-panel-shadow">
            <div className="flex items-center gap-3 text-[#E63946] mb-3">
              <AlertTriangle className="w-6 h-6" />
              <span className="font-display font-bold text-lg text-[#171717]">
                Workspace Recovery
              </span>
            </div>
            <p className="text-sm text-[#737373] mb-6 leading-relaxed">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#171717] text-white text-sm font-semibold border border-[#222222] hover:bg-[#E63946] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reload View
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
