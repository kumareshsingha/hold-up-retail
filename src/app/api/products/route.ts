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

        const where: any = {}
        const include: any = {}

        if (session.user.role === "Seller") {
            where.sellerId = session.user.sellerId
        } else {
            include.seller = true
        }

        const products = await prisma.product.findMany({
            where,
            include,
            orderBy: { createdAt: "desc" }
        })

        return NextResponse.json(products)
    } catch (error) {
        console.error("Error fetching products:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["Super Admin", "Seller"].includes(session.user?.role as string)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const data = await req.json()
        const { name, sku, imageUrl, category, costPrice, sellingPrice, stock } = data

        // Validate required fields
        if (!name || !sku || !category || costPrice === undefined || sellingPrice === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const existingProduct = await prisma.product.findUnique({ where: { sku } })
        if (existingProduct) {
            return NextResponse.json({ error: "Product with this SKU already exists" }, { status: 400 })
        }

        const product = await prisma.product.create({
            data: {
                name,
                sku,
                imageUrl,
                category,
                costPrice: Number(costPrice),
                sellingPrice: Number(sellingPrice),
                stock: Number(stock) || 0,
                sellerId: session.user.sellerId || "", // If Super Admin creates, UI must pass sellerId, but for now fallback to session
                status: session.user.role === "Super Admin" ? "APPROVED" : "PENDING"
            }
        })

        return NextResponse.json(product, { status: 201 })
    } catch (error) {
        console.error("Error creating product:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
