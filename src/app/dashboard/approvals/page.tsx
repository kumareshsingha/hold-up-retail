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
import { Button } from "@/components/ui/button"
import { Check, X, Package } from "lucide-react"

type Product = {
    id: string
    name: string
    sku: string
    category: string
    sellingPrice: number
    stock: number
    seller: { name: string }
}

export default function ApprovalsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPendingProducts()
    }, [])

    async function fetchPendingProducts() {
        setLoading(true)
        try {
            // Need a pending-only endpoint or fetch all and filter
            const res = await fetch("/api/products") // Currently returns all
            if (res.ok) {
                const data = await res.json()
                setProducts(data.filter((p: any) => p.status === "PENDING"))
            }
        } catch (error) {
            console.error("Failed to fetch products", error)
        } finally {
            setLoading(false)
        }
    }

    async function handleAction(id: string, status: "APPROVED" | "REJECTED") {
        try {
            const res = await fetch(`/api/products/${id}/approve`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            })
            if (res.ok) {
                setProducts(prev => prev.filter(p => p.id !== id))
            }
        } catch (error) {
            console.error("Action failed", error)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Product Approvals
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Review and approve new product listings from sellers.
                </p>
            </div>

            <div className="rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Seller</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">Loading...</TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-zinc-500">
                                    No pending products.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-zinc-400" />
                                            {product.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>{(product as any).seller?.name || "Unknown Vendor"}</TableCell>
                                    <TableCell>{product.category}</TableCell>
                                    <TableCell className="text-right">₹{product.sellingPrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-center flex justify-center gap-2">
                                        <Button size="sm" onClick={() => handleAction(product.id, "APPROVED")} className="bg-green-600 hover:bg-green-700 text-white">
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleAction(product.id, "REJECTED")}>
                                            <X className="h-4 w-4" />
                                        </Button>
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
