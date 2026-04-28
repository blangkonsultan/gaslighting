import React from "react"

type Props = {
  children: React.ReactNode
}

type State = {
  error: unknown
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Unknown error"
}

function looksLikeMissingEnv(message: string) {
  return message.includes("Missing VITE_SUPABASE_URL") || message.includes("VITE_SUPABASE_ANON_KEY")
}

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: unknown): State {
    return { error }
  }

  componentDidCatch(error: unknown) {
    // Keep a console trail in production; Vercel captures console output.
    console.error("[AppErrorBoundary] Uncaught error", error)
  }

  render() {
    if (!this.state.error) return this.props.children

    const message = getErrorMessage(this.state.error)
    const isMissingEnv = looksLikeMissingEnv(message)

    return (
      <div className="min-h-dvh bg-[#FBE8CE] px-5 py-8 text-slate-900">
        <div className="mx-auto w-full max-w-xl rounded-2xl border border-black/10 bg-white/70 p-6 shadow-sm backdrop-blur">
          <h1 className="text-balance text-xl font-semibold leading-tight">App failed to start</h1>
          <p className="mt-2 text-sm text-slate-700">
            {isMissingEnv
              ? "This deployment is missing required environment variables."
              : "An unexpected error occurred while loading the app."}
          </p>

          <div className="mt-4 rounded-lg border border-black/10 bg-white p-3">
            <p className="font-mono text-xs text-slate-800">{message}</p>
          </div>

          {isMissingEnv ? (
            <div className="mt-4 space-y-2 text-sm text-slate-800">
              <p className="font-medium">Fix on Vercel</p>
              <ul className="list-disc pl-5">
                <li>
                  Add <span className="font-mono">VITE_SUPABASE_URL</span> and{" "}
                  <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> to your Project Environment Variables.
                </li>
                <li>Redeploy (or trigger a new deployment) after saving.</li>
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    )
  }
}

