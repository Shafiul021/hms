import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * ErrorBoundary — catches React render errors and shows a graceful fallback UI.
 * Usage: wrap page sections or the entire app tree with <ErrorBoundary>.
 */
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        // Could log to an error tracking service here (e.g. Sentry)
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[60vh] flex items-center justify-center p-6">
                    <div className="max-w-md w-full text-center space-y-6">
                        {/* Icon */}
                        <div className="w-20 h-20 mx-auto rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shadow-sm">
                            <AlertTriangle className="w-10 h-10 text-rose-500" />
                        </div>

                        {/* Title */}
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Something went wrong</h1>
                            <p className="text-sm text-slate-500 mt-2">
                                An unexpected error occurred while rendering this page. Our team has been notified.
                            </p>
                        </div>

                        {/* Error detail (dev-friendly) */}
                        {this.state.error && (
                            <details className="text-left bg-slate-50 border border-slate-100 rounded-xl p-4">
                                <summary className="text-xs font-semibold text-slate-500 cursor-pointer select-none">
                                    Technical details
                                </summary>
                                <pre className="text-xs text-rose-600 mt-2 overflow-auto max-h-40 whitespace-pre-wrap">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={this.handleReset}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-500/20"
                            >
                                <RefreshCw className="w-4 h-4" /> Try Again
                            </button>
                            <Link
                                to="/dashboard"
                                onClick={this.handleReset}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
                            >
                                <Home className="w-4 h-4" /> Go to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
