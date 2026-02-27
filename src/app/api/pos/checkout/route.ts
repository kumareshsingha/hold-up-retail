import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["Super Admin", "Store Manager", "Cashier"].includes(session.user?.role as string)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { cart, paymentMethod, locationId, customerId, totalAmount } = await req.json()

        if (!cart || cart.length === 0 || !paymentMethod || !locationId || totalAmount === undefined) {
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
                    locationId,
                    customerId: customerId || null,
                }
            })

            // 2. Add Transaction Items and deduct Inventory
            for (const item of cart) {
                // Verify stock first
                const inventoryRecord = await tx.inventory.findUnique({
                    where: {
                        productId_locationId: {
                            productId: item.id,
                            locationId: locationId
                        }
                    }
                })

                if (!inventoryRecord || inventoryRecord.quantity < item.cartQuantity) {
                    throw new Error(`Insufficient stock for ${item.name}. Available: ${inventoryRecord?.quantity || 0}`)
                }

                // Deduct stock
                await tx.inventory.update({
                    where: { id: inventoryRecord.id },
                    data: {
                        quantity: { decrement: item.cartQuantity }
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

                // Log Stock Movement
                await tx.stockMovement.create({
                    data: {
                        productId: item.id,
                        fromLocationId: locationId,
                        quantity: item.cartQuantity,
                        reason: `POS Sale #${transaction.id}`
                    }
                })
            }

            return transaction
        })

        return NextResponse.json({ message: "Checkout successful", transactionId: result.id }, { status: 200 })

    } catch (error: any) {
        console.error("Checkout Error:", error)
        if (error.message.includes("Insufficient stock")) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ error: "Internal Server Error during checkout" }, { status: 500 })
    }
}
