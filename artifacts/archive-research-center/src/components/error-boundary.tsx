import * as React from "react"
import { useLocation } from "wouter"

import { cn } from "@/lib/utils"

function ErrorBoundary({
  children,
  resetKey,
}: {
  children: React.ReactNode
  resetKey?: any
}) {
  return (
    <ReactErrorBoundary key={resetKey} fallbackRender={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  )
}

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center space-y-4 p-8 text-center">
      <div className="rounded-full bg-destructive/10 p-3 text-destructive">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred."}
        </p>
      </div>
      <button
        onClick={resetErrorBoundary}
        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      >
        Try again
      </button>
    </div>
  )
}

// Simple React Error Boundary implementation
class ReactErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.key !== prevProps.key && this.state.hasError) {
      this.setState({ hasError: false, error: null })
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallbackRender({
        error: this.state.error,
        resetErrorBoundary: () =>
          this.setState({ hasError: false, error: null }),
      })
    }

    return this.props.children
  }
}

export { ErrorBoundary }
