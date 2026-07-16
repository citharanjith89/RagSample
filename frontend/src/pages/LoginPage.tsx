import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { login } from "../services/api"

interface Props {
  onLogin?: (role: string) => void
}

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const registered = new URLSearchParams(window.location.search).get("registered")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await login(email, password)
      if (onLogin) {
        onLogin(res.role)
      } else {
        navigate("/", { replace: true })
      }
    } catch (err: any) {
      // Handle different error types
      if (err.response?.status === 500) {
        console.error("Server Error (500):", err.response?.data)
        setError("A server error occurred. Check backend logs for details. Please try again later.")
      } else if (err.response?.status === 401) {
        console.error("Unauthorized (401):", err.response?.data)
        setError("Invalid email or password.")
      } else if (err.response?.status === 422) {
        console.error("Validation Error (422):", err.response?.data)
        setError("Please check your email and password format.")
      } else if (err.message === "Network Error") {
        console.error("Network Error:", err)
        const host = import.meta.env.VITE_API_URL || "http://localhost:8000"
        setError(`Cannot reach the server. Is the backend running and accessible at ${host}?`)

      } else {
        console.error("Login failed:", err)
        setError(err.response?.data?.detail ?? "Login failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
        <p className="text-sm text-gray-500 mb-6">Sign in to Enterprise RAG</p>
        {registered && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
            Account created! Please sign in.
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-green-700 hover:underline font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
