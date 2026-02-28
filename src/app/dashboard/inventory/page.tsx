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
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

type Product = {
    id: string
    name: string
    sku: string
    category: string
    sellingPrice: number
    inventory: { quantity: number; location: { name: string } }[]
}

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [name, setName] = useState("")
    const [sku, setSku] = useState("")
    const [category, setCategory] = useState("")
    const [costPrice, setCostPrice] = useState("")
    const [sellingPrice, setSellingPrice] = useState("")
    const [imageUrl, setImageUrl] = useState("")

    useEffect(() => {
        fetchProducts()
    }, [])

    async function fetchProducts() {
        setLoading(true)
        try {
            const res = await fetch("/api/products")
            if (res.ok) {
                const data = await res.json()
                setProducts(data)
            }
        } catch (error) {
            console.error("Failed to fetch products", error)
        } finally {
            setLoading(false)
        }
    }

    const getTotalStock = (inventory: Product["inventory"]) => {
        return inventory.reduce((acc, curr) => acc + curr.quantity, 0)
    }

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name, sku, imageUrl, category, costPrice: Number(costPrice), sellingPrice: Number(sellingPrice)
                })
            })
            if (res.ok) {
                await fetchProducts()
                setIsDialogOpen(false)
                setName("")
                setSku("")
                setImageUrl("")
                setCategory("")
                setCostPrice("")
                setSellingPrice("")
            } else {
                const error = await res.json()
                alert(error.error || "Failed to add product")
            }
        } catch (error) {
            console.error("Error adding product:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        Inventory Management
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Manage your central product catalog and stock levels.
                    </p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        id="csvUpload"
                        accept=".csv"
                        className="hidden"
                        onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return

                            const text = await file.text()
                            // Simple CSV Parse
                            const lines = text.split('\n').filter(line => line.trim())
                            const headers = lines[0].split(',').map(h => h.trim())
                            const productsList = lines.slice(1).map(line => {
                                const values = line.split(',')
                                const entry: any = {}
                                headers.forEach((h, i) => {
                                    entry[h] = values[i]?.trim()
                                })
                                return entry
                            })

                            if (productsList.length > 0) {
                                const res = await fetch("/api/products/import", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ products: productsList })
                                })
                                if (res.ok) {
                                    const result = await res.json()
                                    alert(result.message + (result.errors ? `\\nWarnings:\\n${result.errors.join('\\n')}` : ''))
                                    fetchProducts()
                                } else {
                                    alert("Failed to import CSV")
                                }
                            }
                        }}
                    />
                    <Button variant="outline" onClick={() => document.getElementById('csvUpload')?.click()}>
                        Import CSV
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#4c1d95] hover:bg-[#5b21b6] text-white">
                                <Plus className="mr-2 h-4 w-4" /> Add Product
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add New Product</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAddProduct} className="space-y-4 pt-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Name</Label>
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="sku" className="text-right">SKU</Label>
                                    <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="imageUrl" className="text-right">Image URL</Label>
                                    <Input id="imageUrl" placeholder="https://" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="category" className="text-right">Category</Label>
                                    <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="costPrice" className="text-right">Cost (₹)</Label>
                                    <Input id="costPrice" type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="sellingPrice" className="text-right">Price (₹)</Label>
                                    <Input id="sellingPrice" type="number" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} className="col-span-3" required />
                                </div>
                                <div className="flex justify-end mt-4">
                                    <Button type="submit" disabled={isSubmitting} className="bg-[#4c1d95] hover:bg-[#5b21b6] text-white">
                                        {isSubmitting ? "Adding..." : "Add Product"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product Name</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Total Stock</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    Loading products...
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-zinc-500">
                                    No products found. Click "Add Product" to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium flex items-center space-x-3">
                                        {(product as any).imageUrl ? (
                                            <img src={(product as any).imageUrl} alt={product.name} className="w-10 h-10 object-cover rounded-md border" />
                                        ) : (
                                            <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-md flex items-center justify-center text-xs text-zinc-400">No Img</div>
                                        )}
                                        <span>{product.name}</span>
                                    </TableCell>
                                    <TableCell>{product.sku}</TableCell>
                                    <TableCell>{product.category}</TableCell>
                                    <TableCell className="text-right">₹{product.sellingPrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                                            {getTotalStock(product.inventory)}
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
