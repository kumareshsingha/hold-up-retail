"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Product = {
    id: string
    name: string
    sku: string
}

type Location = {
    id: string
    name: string
    type: string
}

export default function TransfersPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [locations, setLocations] = useState<Location[]>([])

    // Adjustment State
    const [adjProduct, setAdjProduct] = useState("")
    const [adjLocation, setAdjLocation] = useState("")
    const [adjQuantity, setAdjQuantity] = useState("")
    const [adjReason, setAdjReason] = useState("")
    const [adjLoading, setAdjLoading] = useState(false)

    // Transfer State
    const [txProduct, setTxProduct] = useState("")
    const [txFromLocation, setTxFromLocation] = useState("")
    const [txToLocation, setTxToLocation] = useState("")
    const [txQuantity, setTxQuantity] = useState("")
    const [txLoading, setTxLoading] = useState(false)

    useEffect(() => {
        Promise.all([
            fetch("/api/products").then((res) => res.json()),
            fetch("/api/locations").then((res) => res.json())
        ]).then(([pData, lData]) => {
            setProducts(pData)
            setLocations(lData)
        })
    }, [])

    const handleAdjustment = async (e: React.FormEvent) => {
        e.preventDefault()
        setAdjLoading(true)
        try {
            const res = await fetch("/api/inventory/adjust", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: adjProduct,
                    locationId: adjLocation,
                    quantity: Number(adjQuantity),
                    reason: adjReason
                })
            })
            if (res.ok) {
                alert("Stock adjusted successfully!")
                setAdjQuantity("")
                setAdjReason("")
            } else {
                const error = await res.json()
                alert(error.error || "Failed to adjust stock")
            }
        } catch (error) {
            console.error(error)
            alert("An error occurred")
        } finally {
            setAdjLoading(false)
        }
    }

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault()
        setTxLoading(true)
        try {
            const res = await fetch("/api/inventory/transfer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: txProduct,
                    fromLocationId: txFromLocation,
                    toLocationId: txToLocation,
                    quantity: Number(txQuantity),
                })
            })
            if (res.ok) {
                alert("Stock transferred successfully!")
                setTxQuantity("")
            } else {
                const error = await res.json()
                alert(error.error || "Failed to transfer stock")
            }
        } catch (error) {
            console.error(error)
            alert("An error occurred")
        } finally {
            setTxLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Stock Adjustments & Transfers
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Move stock between branch locations or manually correct discrepancies.
                </p>
            </div>

            <Tabs defaultValue="adjust" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="adjust">Manual Adjustment</TabsTrigger>
                    <TabsTrigger value="transfer">Location Transfer</TabsTrigger>
                </TabsList>

                <TabsContent value="adjust" className="mt-6">
                    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                        <h3 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">Correct Stock Discrepancy</h3>
                        <form onSubmit={handleAdjustment} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Location</Label>
                                    <Select value={adjLocation} onValueChange={setAdjLocation} required>
                                        <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                                        <SelectContent>
                                            {locations.map(loc => (
                                                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Product</Label>
                                    <Select value={adjProduct} onValueChange={setAdjProduct} required>
                                        <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                                        <SelectContent>
                                            {products.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Quantity (Use negative to remove)</Label>
                                    <Input type="number" required value={adjQuantity} onChange={e => setAdjQuantity(e.target.value)} placeholder="e.g. 5 or -2" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Reason</Label>
                                    <Input required value={adjReason} onChange={e => setAdjReason(e.target.value)} placeholder="e.g. Damaged goods, found stock" />
                                </div>
                            </div>
                            <Button type="submit" disabled={adjLoading} className="bg-[#55142a] hover:bg-[#6f1b37] text-white">
                                {adjLoading ? "Processing..." : "Submit Adjustment"}
                            </Button>
                        </form>
                    </div>
                </TabsContent>

                <TabsContent value="transfer" className="mt-6">
                    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                        <h3 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">Transfer Stock</h3>
                        <form onSubmit={handleTransfer} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>From Location (Source)</Label>
                                    <Select value={txFromLocation} onValueChange={setTxFromLocation} required>
                                        <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                                        <SelectContent>
                                            {locations.map(loc => (
                                                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>To Location (Destination)</Label>
                                    <Select value={txToLocation} onValueChange={setTxToLocation} required>
                                        <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
                                        <SelectContent>
                                            {locations.map(loc => (
                                                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label>Product</Label>
                                    <Select value={txProduct} onValueChange={setTxProduct} required>
                                        <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                                        <SelectContent>
                                            {products.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Quantity to Transfer</Label>
                                    <Input type="number" min="1" required value={txQuantity} onChange={e => setTxQuantity(e.target.value)} placeholder="Must be > 0" />
                                </div>
                            </div>
                            <Button type="submit" disabled={txLoading} className="bg-[#55142a] hover:bg-[#6f1b37] text-white">
                                {txLoading ? "Processing..." : "Initiate Transfer"}
                            </Button>
                        </form>
                    </div>
                </TabsContent>

            </Tabs>
        </div>
    )
}
