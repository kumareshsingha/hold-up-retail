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

        const where: any = {
            stock: {
                lte: 10 // Threshold for low stock
            }
        }

        if (session.user.role === "Seller") {
            where.sellerId = session.user.sellerId
        }

        const products = await prisma.product.findMany({
            where,
            orderBy: { stock: "asc" }
        })

        return NextResponse.json(products)
    } catch (error) {
        console.error("Error fetching low stock:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
