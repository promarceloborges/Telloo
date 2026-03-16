
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Ops! Algo deu errado.</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Ocorreu um erro inesperado na interface do Telloo. Não se preocupe, seus dados de estudo estão seguros.
            </p>
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 w-full py-4 bg-telloo-neonGreen text-black font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <RefreshCw size={20} />
              Recarregar Telloo
            </button>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-6 p-4 bg-black/50 rounded-xl text-left text-[10px] text-red-400 overflow-auto max-h-32">
                {this.state.error?.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
