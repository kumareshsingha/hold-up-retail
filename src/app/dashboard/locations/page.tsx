"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Store } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

type Location = {
    id: string
    name: string
    type: string
    _count: { inventory: number }
}

export default function LocationsPage() {
    const [locations, setLocations] = useState<Location[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form
    const [name, setName] = useState("")
    const [type, setType] = useState("Store")

    useEffect(() => {
        fetchLocations()
    }, [])

    async function fetchLocations() {
        try {
            const res = await fetch("/api/locations")
            if (res.ok) {
                const data = await res.json()
                setLocations(data)
            }
        } catch (error) {
            console.error("Failed to fetch locations", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddLocation = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const res = await fetch("/api/locations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, type })
            })
            if (res.ok) {
                await fetchLocations()
                setIsDialogOpen(false)
                setName("")
                setType("Store")
            } else {
                const error = await res.json()
                alert(error.error || "Failed to add location")
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Locations</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage stores, warehouses, and exhibition spaces.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#4c1d95] hover:bg-[#5b21b6] text-white">
                            <Plus className="mr-2 h-4 w-4" /> Add Location
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Location</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddLocation} className="space-y-4 pt-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="type" className="text-right">Type</Label>
                                <select
                                    id="type"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="col-span-3 flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:focus-visible:ring-zinc-300"
                                >
                                    <option value="Store">Store</option>
                                    <option value="Warehouse">Warehouse</option>
                                    <option value="Exhibition">Exhibition</option>
                                </select>
                            </div>
                            <div className="flex justify-end mt-4">
                                <Button type="submit" disabled={isSubmitting} className="bg-[#4c1d95] hover:bg-[#5b21b6] text-white">
                                    {isSubmitting ? "Saving..." : "Save Location"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {locations.map((location) => (
                    <div key={location.id} className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-[#4c1d95]/10 rounded-lg dark:bg-[#4c1d95]/20">
                                <Store className="h-6 w-6 text-[#4c1d95] dark:text-[#a78bfa]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{location.name}</h3>
                                <p className="text-sm text-zinc-500 capitalize">{location.type.toLowerCase()}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                <span className="font-semibold">{location._count?.inventory || 0}</span> product lines stocked
                            </p>
                            <p className="text-xs text-zinc-400 mt-1">ID: {location.id}</p>
                        </div>
                    </div>
                ))}
                {locations.length === 0 && !loading && (
                    <div className="col-span-full text-center py-10 text-zinc-500 text-sm">
                        No locations added yet. Click "Add Location" to start.
                    </div>
                )}
            </div>
        </div>
    )
}
