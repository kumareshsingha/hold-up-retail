"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        })

        if (result?.error) {
            setError("Invalid email or password")
            setLoading(false)
        } else {
            router.push("/dashboard")
            router.refresh()
        }
    }

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-gray-50/50 dark:bg-zinc-950">
            <div className="mx-auto w-full max-w-[400px] p-6 lg:p-8">
                <div className="flex flex-col items-center space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-[#55142a]">
                        Craftomania Partners
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Enter your email and password to access your account
                    </p>
                </div>
                <div className="mt-8 shadow-sm border border-zinc-200 bg-white rounded-xl dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="space-y-4">
                            {error && (
                                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 rounded-md">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-700 dark:text-zinc-300" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-100"
                                    id="email"
                                    placeholder="m@example.com"
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-700 dark:text-zinc-300" htmlFor="password">
                                    Password
                                </label>
                                <input
                                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-100"
                                    id="password"
                                    required
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <button
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] disabled:pointer-events-none disabled:opacity-50 bg-[#55142a] text-white hover:bg-[#6f1b37] h-10 w-full"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? "Signing in..." : "Sign in"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
