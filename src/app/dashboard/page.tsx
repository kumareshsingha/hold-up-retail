"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Package, Receipt, IndianRupee } from "lucide-react"

type DashboardData = {
    totalProducts: number
    lowStockCount: number
    totalRevenue: number
    totalSales: number
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData>({ totalProducts: 0, lowStockCount: 0, totalRevenue: 0, totalSales: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                const [productsRes, lowStockRes, analyticsRes] = await Promise.all([
                    fetch("/api/products"),
                    fetch("/api/inventory/low-stock"),
                    fetch("/api/analytics")
                ])

                if (productsRes.ok && lowStockRes.ok && analyticsRes.ok) {
                    const products = await productsRes.json()
                    const lowStock = await lowStockRes.json()
                    const analytics = await analyticsRes.json()

                    setData({
                        totalProducts: products.length,
                        lowStockCount: lowStock.length,
                        totalRevenue: analytics.totalRevenue,
                        totalSales: analytics.totalSales
                    })
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error)
            } finally {
                setLoading(false)
            }
        }
        fetchDashboardData()
    }, [])

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Dashboard Overview
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Welcome to Hold Up Retail Solutions.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Revenue Card (Placeholder for now) */}
                <div className="rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Total Revenue</h3>
                        <IndianRupee className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <div className="text-2xl font-bold">₹{loading ? "..." : data.totalRevenue.toLocaleString("en-IN")}</div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Across all locations
                    </p>
                </div>

                {/* Sales Card (Placeholder for now) */}
                <div className="rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Sales Count</h3>
                        <Receipt className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <div className="text-2xl font-bold">{loading ? "..." : data.totalSales}</div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Completed transactions
                    </p>
                </div>

                {/* Active Products Card */}
                <div className="rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Active Products</h3>
                        <Package className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <div className="text-2xl font-bold">{loading ? "..." : data.totalProducts}</div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Across all locations
                    </p>
                </div>

                {/* Low Stock Alerts Card */}
                <div className="rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-red-600 dark:text-red-400">Low Stock Alerts</h3>
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {loading ? "..." : data.lowStockCount}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Requires immediate attention
                    </p>
                </div>
            </div>
        </div>
    )
}
