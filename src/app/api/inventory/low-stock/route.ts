import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Fetch all products with their inventory
        const products = await prisma.product.findMany({
            include: {
                inventory: {
                    include: { location: true }
                }
            }
        })

        // Filter products where total stock across all locations is <= reorderLevel
        const lowStockAlerts = products.filter((product: any) => {
            const totalStock = product.inventory.reduce((acc: number, curr: any) => acc + curr.quantity, 0)
            return totalStock <= product.reorderLevel
        }).map((product: any) => {
            const totalStock = product.inventory.reduce((acc: number, curr: any) => acc + curr.quantity, 0)
            return {
                ...product,
                totalStock
            }
        })

        return NextResponse.json(lowStockAlerts)
    } catch (error) {
        console.error("Error fetching low stock alerts:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
