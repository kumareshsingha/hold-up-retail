import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Plus, Store } from "lucide-react"

export default async function LocationsPage() {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "Super Admin") {
        redirect("/dashboard")
    }

    const locations = await prisma.location.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { inventory: true }
            }
        }
    })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Locations</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage stores, warehouses, and exhibition spaces.</p>
                </div>
                <Button className="bg-[#4c1d95] hover:bg-[#5b21b6] text-white">
                    <Plus className="mr-2 h-4 w-4" /> Add Location
                </Button>
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
                                <span className="font-semibold">{location._count.inventory}</span> product lines stocked
                            </p>
                            <p className="text-xs text-zinc-400 mt-1">ID: {location.id}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
