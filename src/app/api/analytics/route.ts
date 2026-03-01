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

        const where: any = { status: "COMPLETED" }
        if (session.user.role === "Seller") {
            where.sellerId = session.user.sellerId
        }

        // 1. Total Revenue (sum of all completed transactions)
        const revenueResult = await prisma.transaction.aggregate({
            _sum: {
                totalAmount: true
            },
            where
        })

        const totalRevenue = revenueResult._sum.totalAmount || 0

        // 2. Total Sales Count
        const totalSales = await prisma.transaction.count({
            where
        })

        return NextResponse.json({
            totalRevenue,
            totalSales,
        })
    } catch (error) {
        console.error("Error fetching analytics:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
