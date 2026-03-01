import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "Super Admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { status } = await req.json() // APPROVED or REJECTED

        if (!["APPROVED", "REJECTED"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 })
        }

        const product = await prisma.product.update({
            where: { id: params.id },
            data: { status }
        })

        return NextResponse.json(product)
    } catch (error) {
        console.error("Error approving product:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
