import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "Super Admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const sellers = await prisma.seller.findMany({
            include: {
                _count: {
                    select: { products: true, users: true }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        return NextResponse.json(sellers)
    } catch (error) {
        console.error("Error fetching sellers:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "Super Admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { name, contactInfo, status } = await req.json()

        if (!name) {
            return NextResponse.json({ error: "Seller name is required" }, { status: 400 })
        }

        const seller = await prisma.seller.create({
            data: {
                name,
                contactInfo,
                status: status || "ACTIVE"
            }
        })

        return NextResponse.json(seller, { status: 201 })
    } catch (error) {
        console.error("Error creating seller:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
