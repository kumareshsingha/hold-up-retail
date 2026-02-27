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

        const { productId, locationId, quantity, reason } = await req.json()

        if (!productId || !locationId || quantity === undefined || !reason) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Use a transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get or create inventory record
            const inventory = await tx.inventory.upsert({
                where: {
                    productId_locationId: {
                        productId,
                        locationId
                    }
                },
                update: {
                    quantity: {
                        increment: quantity // can be negative for deduction
                    }
                },
                create: {
                    productId,
                    locationId,
                    quantity: quantity
                }
            })

            // 2. Prevent negative inventory
            if (inventory.quantity < 0) {
                throw new Error(`Insufficient stock. Cannot reduce by ${Math.abs(quantity)}`)
            }

            // 3. Log stock movement
            await tx.stockMovement.create({
                data: {
                    productId,
                    toLocationId: quantity > 0 ? locationId : undefined,
                    fromLocationId: quantity < 0 ? locationId : undefined,
                    quantity: Math.abs(quantity),
                    reason,
                }
            })

            return inventory
        })

        return NextResponse.json(result, { status: 200 })
    } catch (error: any) {
        console.error("Error adjusting stock:", error)
        if (error.message.includes("Insufficient stock")) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
