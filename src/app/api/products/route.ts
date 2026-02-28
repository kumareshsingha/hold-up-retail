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

        const products = await prisma.product.findMany({
            include: {
                variants: true,
                inventory: {
                    include: { location: true }
                }
            },
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
        if (!session || !["Super Admin", "Store Manager", "Inventory Manager"].includes(session.user?.role as string)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const data = await req.json()
        const { name, sku, barcode, imageUrl, category, costPrice, sellingPrice, taxPct, reorderLevel } = data

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
                barcode,
                imageUrl,
                category,
                costPrice: Number(costPrice),
                sellingPrice: Number(sellingPrice),
                taxPct: Number(taxPct) || 0,
                reorderLevel: Number(reorderLevel) || 5,
            }
        })

        return NextResponse.json(product, { status: 201 })
    } catch (error) {
        console.error("Error creating product:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
