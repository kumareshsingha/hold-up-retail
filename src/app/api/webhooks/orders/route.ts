import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Basic webhook secret validation (In production, use crypto.verify for Shopify/Stripe signatures)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "default_dev_secret"

export async function POST(req: Request) {
    try {
        // 1. Verify Authorization
        const authHeader = req.headers.get("authorization")
        if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized Webhook Request" }, { status: 401 })
        }

        // 2. Parse Payload (Expecting a generic e-commerce payload)
        // Example: { orderId: "123", source: "SHOPIFY", sellerId: "cl_123", items: [{ sku: "TSHIRT-01", quantity: 2, price: 500 }] }
        const { orderId, source, items, sellerId } = await req.json()

        if (!orderId || !items || !Array.isArray(items)) {
            return NextResponse.json({ error: "Invalid webhook payload format" }, { status: 400 })
        }

        // 3. Find target seller
        let targetSellerId = sellerId
        if (!targetSellerId) {
            const firstSeller = await prisma.seller.findFirst()
            if (!firstSeller) {
                return NextResponse.json({ error: "No sellers available for fulfillment" }, { status: 500 })
            }
            targetSellerId = firstSeller.id
        }

        // 4. Process the order atomically
        const result = await prisma.$transaction(async (tx) => {
            // Create an online transaction record
            const invoiceNumber = `WEB-${source}-${orderId}-${Date.now()}`
            const totalAmount = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)

            const transaction = await tx.transaction.create({
                data: {
                    invoiceNumber,
                    totalAmount,
                    paymentMethod: "ONLINE",
                    status: "COMPLETED",
                    source: source || "ONLINE_STORE",
                    sellerId: targetSellerId,
                }
            })

            // Deduct Inventory for each item
            for (const item of items) {
                // Find Product by SKU
                const product = await tx.product.findUnique({
                    where: { sku: item.sku }
                })

                if (!product) {
                    console.warn(`Webhook: Product with SKU ${item.sku} not found. Skipping stock deduction.`)
                    continue
                }

                // Deduct stock (Allow negative to show backlog)
                await tx.product.update({
                    where: { id: product.id },
                    data: {
                        stock: { decrement: item.quantity }
                    }
                })

                // Log Transaction Item
                await tx.transactionItem.create({
                    data: {
                        transactionId: transaction.id,
                        productId: product.id,
                        quantity: item.quantity,
                        price: item.price
                    }
                })
            }

            return transaction
        })

        return NextResponse.json({ message: "Webhook processed successfully", transactionId: result.id }, { status: 200 })

    } catch (error: any) {
        console.error("Webhook processing error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
