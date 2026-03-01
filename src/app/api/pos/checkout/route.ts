import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["Super Admin", "Seller"].includes(session.user?.role as string)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { cart, paymentMethod, customerId, totalAmount, sellerId } = await req.json()

        const activeSellerId = session.user?.role === "Seller" ? session.user.sellerId : sellerId

        if (!cart || cart.length === 0 || !paymentMethod || !activeSellerId || totalAmount === undefined) {
            return NextResponse.json({ error: "Missing required checkout fields" }, { status: 400 })
        }

        // Process transaction atomically
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Transaction
            const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
            const transaction = await tx.transaction.create({
                data: {
                    invoiceNumber,
                    totalAmount: Number(totalAmount),
                    paymentMethod,
                    status: "COMPLETED",
                    source: "POS",
                    sellerId: activeSellerId,
                    customerId: customerId || null,
                }
            })

            // 2. Add Transaction Items and deduct Inventory
            for (const item of cart) {
                // Verify stock first
                const product = await tx.product.findUnique({
                    where: { id: item.id }
                })

                if (!product || product.stock < item.cartQuantity) {
                    throw new Error(`Insufficient stock for ${item.name}. Available: ${product?.stock || 0}`)
                }

                if (product.sellerId !== activeSellerId) {
                    throw new Error(`Product ${item.name} does not belong to this seller`)
                }

                // Deduct stock
                await tx.product.update({
                    where: { id: product.id },
                    data: {
                        stock: { decrement: item.cartQuantity }
                    }
                })

                // Log Transaction Item
                await tx.transactionItem.create({
                    data: {
                        transactionId: transaction.id,
                        productId: item.id,
                        quantity: item.cartQuantity,
                        price: Number(item.sellingPrice)
                    }
                })
            }

            return transaction
        })

        return NextResponse.json({ message: "Checkout successful", transactionId: result.id }, { status: 200 })

    } catch (error: any) {
        console.error("Checkout Error:", error)
        if (error.message.includes("Insufficient stock") || error.message.includes("does not belong")) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ error: "Internal Server Error during checkout" }, { status: 500 })
    }
}
