import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["Super Admin", "Store Manager", "Inventory Manager"].includes(session.user?.role as string)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { products } = await req.json()

        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ error: "Invalid payload or empty list" }, { status: 400 })
        }

        // Process all products
        const createdProducts = []
        const errors = []

        for (const p of products) {
            try {
                // Check for existing product by SKU
                const existing = await prisma.product.findUnique({ where: { sku: String(p.sku) } })
                if (existing) {
                    errors.push(`SKU ${p.sku} already exists. Skipped.`)
                    continue
                }

                const product = await prisma.product.create({
                    data: {
                        name: String(p.name),
                        sku: String(p.sku),
                        category: String(p.category),
                        costPrice: Number(p.costPrice) || 0,
                        sellingPrice: Number(p.sellingPrice) || 0,
                        reorderLevel: Number(p.reorderLevel) || 5,
                        taxPct: Number(p.taxPct) || 0,
                    }
                })
                createdProducts.push(product)
            } catch (e: any) {
                errors.push(`Failed to import ${p.sku || 'Unknown Product'}: ${e.message}`)
            }
        }

        return NextResponse.json({
            message: `Successfully imported ${createdProducts.length} products.`,
            errors: errors.length > 0 ? errors : undefined
        }, { status: 200 })

    } catch (error) {
        console.error("Error importing products:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
