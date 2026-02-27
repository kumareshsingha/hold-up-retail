"use client"

import { useEffect, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { AlertCircle } from "lucide-react"

type Product = {
    id: string
    name: string
    sku: string
    category: string
    reorderLevel: number
    totalStock: number
}

export default function LowStockPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchLowStockProducts() {
            try {
                const res = await fetch("/api/inventory/low-stock")
                if (res.ok) {
                    const data = await res.json()
                    setProducts(data)
                }
            } catch (error) {
                console.error("Failed to fetch low stock products", error)
            } finally {
                setLoading(false)
            }
        }
        fetchLowStockProducts()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400 flex items-center gap-2">
                        <AlertCircle className="h-6 w-6" />
                        Low Stock Alerts
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Products that have fallen below their minimum reorder thresholds.
                    </p>
                </div>
            </div>

            <div className="rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product Name</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Reorder Level</TableHead>
                            <TableHead className="text-right">Current Stock</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    Loading low stock alerts...
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-zinc-500">
                                    All systems go! No low stock alerts.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow key={product.id} className="bg-red-50/50 dark:bg-red-950/20">
                                    <TableCell className="font-medium text-red-900 dark:text-red-300">{product.name}</TableCell>
                                    <TableCell className="text-red-700 dark:text-red-400">{product.sku}</TableCell>
                                    <TableCell className="text-red-700 dark:text-red-400">{product.category}</TableCell>
                                    <TableCell className="text-right font-medium">{product.reorderLevel}</TableCell>
                                    <TableCell className="text-right">
                                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900 dark:text-red-300">
                                            {product.totalStock}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
