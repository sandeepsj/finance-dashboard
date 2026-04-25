import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
  fallback?: (err: Error, reset: () => void) => ReactNode;
}

interface State {
  err: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(err: Error, info: ErrorInfo): void {
    console.error('[error-boundary]', err, info.componentStack);
  }

  reset = (): void => this.setState({ err: null });

  render(): ReactNode {
    const { err } = this.state;
    if (!err) return this.props.children;
    if (this.props.fallback) return this.props.fallback(err, this.reset);
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card padding={20} className="flex flex-col gap-3 max-w-lg">
          <div className="text-[18px] font-semibold text-loss">Something broke</div>
          <div className="text-[13px] text-ink-muted">
            {err.message || 'An unexpected error occurred while rendering this view.'}
          </div>
          <pre className="text-[11px] font-mono text-ink-subtle bg-surface-alt rounded-sm p-2 overflow-auto max-h-40">
            {err.stack}
          </pre>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => location.reload()}>
              Reload
            </Button>
            <Button variant="primary" size="sm" onClick={this.reset}>
              Try again
            </Button>
          </div>
        </Card>
      </div>
    );
  }
}
