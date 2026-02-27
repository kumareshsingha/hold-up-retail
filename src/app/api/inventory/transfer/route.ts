import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["Super Admin", "Store Manager", "Warehouse Manager"].includes(session.user?.role as string)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { productId, fromLocationId, toLocationId, quantity } = await req.json()

        if (!productId || !fromLocationId || !toLocationId || quantity === undefined || quantity <= 0) {
            return NextResponse.json({ error: "Invalid transfer payload" }, { status: 400 })
        }

        if (fromLocationId === toLocationId) {
            return NextResponse.json({ error: "Source and destination locations cannot be the same" }, { status: 400 })
        }

        // Use a transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Deduct from source
            const sourceInventory = await tx.inventory.update({
                where: {
                    productId_locationId: {
                        productId,
                        locationId: fromLocationId
                    }
                },
                data: {
                    quantity: {
                        decrement: quantity
                    }
                }
            })

            if (sourceInventory.quantity < 0) {
                throw new Error("Insufficient stock at source location.")
            }

            // 2. Add to destination
            const destInventory = await tx.inventory.upsert({
                where: {
                    productId_locationId: {
                        productId,
                        locationId: toLocationId
                    }
                },
                update: {
                    quantity: {
                        increment: quantity
                    }
                },
                create: {
                    productId,
                    locationId: toLocationId,
                    quantity: quantity
                }
            })

            // 3. Log stock movement
            await tx.stockMovement.create({
                data: {
                    productId,
                    fromLocationId,
                    toLocationId,
                    quantity,
                    reason: "Transfer",
                }
            })

            return { sourceInventory, destInventory }
        })

        return NextResponse.json(result, { status: 200 })
    } catch (error: any) {
        console.error("Error transferring stock:", error)
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "No inventory record found at source location" }, { status: 400 })
        }
        if (error.message.includes("Insufficient stock")) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
