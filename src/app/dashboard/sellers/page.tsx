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
import { Plus, Store, Users, Package, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Seller = {
    id: string
    name: string
    contactInfo: string | null
    status: string
    _count: {
        products: number
        users: number
    }
}

export default function SellersPage() {
    const [sellers, setSellers] = useState<Seller[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [name, setName] = useState("")
    const [contactInfo, setContactInfo] = useState("")

    useEffect(() => {
        fetchSellers()
    }, [])

    async function fetchSellers() {
        setLoading(true)
        try {
            const res = await fetch("/api/sellers")
            if (res.ok) {
                const data = await res.json()
                setSellers(data)
            }
        } catch (error) {
            console.error("Failed to fetch sellers", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddSeller = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const res = await fetch("/api/sellers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, contactInfo })
            })
            if (res.ok) {
                await fetchSellers()
                setIsDialogOpen(false)
                setName("")
                setContactInfo("")
            } else {
                const error = await res.json()
                alert(error.error || "Failed to add seller")
            }
        } catch (error) {
            console.error("Error adding seller:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteSeller = async (id: string) => {
        if (!confirm("Are you sure you want to delete this seller? All associated products and data will be removed.")) return

        try {
            const res = await fetch(`/api/sellers/${id}`, { method: "DELETE" })
            if (res.ok) {
                setSellers(prev => prev.filter(s => s.id !== id))
            } else {
                const error = await res.json()
                alert(error.error || "Failed to delete seller")
            }
        } catch (error) {
            console.error("Error deleting seller:", error)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        Seller Management
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Manage vendors and their access to the platform.
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#55142a] hover:bg-[#6f1b37] text-white">
                            <Plus className="mr-2 h-4 w-4" /> Add Seller
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Register New Seller</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddSeller} className="space-y-4 pt-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="contact" className="text-right">Contact Info</Label>
                                <Input id="contact" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} className="col-span-3" placeholder="Email/Phone" />
                            </div>
                            <div className="flex justify-end mt-4">
                                <Button type="submit" disabled={isSubmitting} className="bg-[#55142a] hover:bg-[#6f1b37] text-white">
                                    {isSubmitting ? "Registering..." : "Register Seller"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sellers.map((seller) => (
                    <div key={seller.id} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-[#fff3e3] text-[#55142a] rounded-lg">
                                <Store className="h-6 w-6" />
                            </div>
                            <div className="flex gap-2">
                                <span className={cn(
                                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                    seller.status === "ACTIVE"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                )}>
                                    {seller.status}
                                </span>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteSeller(seller.id)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">{seller.name}</h3>
                        <p className="text-sm text-zinc-500 mb-6">{seller.contactInfo || "No contact info"}</p>

                        <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-zinc-400" />
                                <span className="text-sm font-medium">{seller._count.products} Products</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-zinc-400" />
                                <span className="text-sm font-medium">{seller._count.users} Users</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {sellers.length === 0 && !loading && (
                <div className="text-center py-20 border-2 border-dashed rounded-xl border-zinc-200 dark:border-zinc-800">
                    <Store className="mx-auto h-12 w-12 text-zinc-400 mb-3" />
                    <h3 className="text-lg font-medium">No sellers registered yet</h3>
                    <p className="text-zinc-500">Add your first seller to get started.</p>
                </div>
            )}
        </div>
    )
}
