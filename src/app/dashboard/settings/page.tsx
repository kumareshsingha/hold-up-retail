import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "Super Admin") {
        redirect("/dashboard")
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Settings</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage global application settings and integrations.</p>
            </div>

            <div className="grid gap-6">
                <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 p-6">
                    <h3 className="text-lg font-semibold mb-2">E-Commerce Sync</h3>
                    <p className="text-sm text-zinc-500 mb-4">Configure webhook URLs and API keys for Shopify / WooCommerce integrations.</p>
                    <div className="flex items-center space-x-4 opacity-50">
                        <input disabled className="flex-1 px-3 py-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700 text-sm" value="https://example.myshopify.com" type="text" />
                        <button disabled className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-md text-sm font-medium">Save</button>
                    </div>
                    <p className="text-xs text-red-500 mt-2">Configuration locked. Please contact system administrator.</p>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 p-6">
                    <h3 className="text-lg font-semibold mb-2">Tax Settings</h3>
                    <p className="text-sm text-zinc-500">Global GST modifiers and business profile configurations are coming soon.</p>
                </div>
            </div>
        </div>
    )
}
