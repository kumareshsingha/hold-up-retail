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
        // Example: { orderId: "123", source: "SHOPIFY", items: [{ sku: "TSHIRT-01", quantity: 2, price: 500 }] }
        const { orderId, source, items } = await req.json()

        if (!orderId || !items || !Array.isArray(items)) {
            return NextResponse.json({ error: "Invalid webhook payload format" }, { status: 400 })
        }

        // 3. Find default fulfillment location (e.g., Warehouse)
        let fulfillmentLocation = await prisma.location.findFirst({
            where: { type: "Warehouse" }
        })

        if (!fulfillmentLocation) {
            // Fallback to the first available location
            fulfillmentLocation = await prisma.location.findFirst()
            if (!fulfillmentLocation) {
                return NextResponse.json({ error: "No locations available for fulfillment" }, { status: 500 })
            }
        }

        // 4. Process the order atomically
        const result = await prisma.$transaction(async (tx) => {
            // Create an online transaction record
            const invoiceNumber = `WEB-${source}-${orderId}-${Date.now()}`
            const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0)

            const transaction = await tx.transaction.create({
                data: {
                    invoiceNumber,
                    totalAmount,
                    paymentMethod: "ONLINE",
                    status: "COMPLETED",
                    source: source || "ONLINE_STORE",
                    locationId: fulfillmentLocation.id,
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

                // Find or Create Inventory Record
                const inventory = await tx.inventory.findUnique({
                    where: {
                        productId_locationId: {
                            productId: product.id,
                            locationId: fulfillmentLocation.id
                        }
                    }
                })

                if (!inventory) {
                    console.warn(`Webhook: No inventory record at fulfillment center for ${product.sku}. Generating empty record.`)
                }

                // Deduct stock (Allowing negative stock for online orders so fulfillment managers can see backlog)
                await tx.inventory.upsert({
                    where: {
                        productId_locationId: {
                            productId: product.id,
                            locationId: fulfillmentLocation.id
                        }
                    },
                    update: {
                        quantity: { decrement: item.quantity }
                    },
                    create: {
                        productId: product.id,
                        locationId: fulfillmentLocation.id, // Fallback if no specific locationId is found
                        quantity: -item.quantity
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

                // Log Stock Movement
                await tx.stockMovement.create({
                    data: {
                        productId: product.id,
                        fromLocationId: fulfillmentLocation.id,
                        quantity: item.quantity,
                        reason: `Online Order #${orderId} (${source})`
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
