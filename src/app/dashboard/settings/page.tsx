"use client"

import { useState } from "react"

export default function SettingsPage() {
    const [webhookUrl, setWebhookUrl] = useState("https://example.myshopify.com")
    const [isSaving, setIsSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const handleSave = () => {
        setIsSaving(true)
        setTimeout(() => {
            setIsSaving(false)
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        }, 800)
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
                    <div className="flex items-center space-x-4">
                        <input
                            className="flex-1 px-3 py-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700 text-sm focus:outline-none focus:ring-1 focus:ring-[#4c1d95]"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            type="text"
                            placeholder="Enter webhook URL..."
                        />
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'}`}
                        >
                            {isSaving ? "Saving..." : saved ? "Saved!" : "Save"}
                        </button>
                    </div>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 p-6">
                    <h3 className="text-lg font-semibold mb-2">Tax Settings</h3>
                    <p className="text-sm text-zinc-500">Global GST modifiers and business profile configurations are coming soon.</p>
                </div>
            </div>
        </div>
    )
}
