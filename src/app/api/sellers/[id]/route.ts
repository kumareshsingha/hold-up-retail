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

        const { name, contactInfo, status } = await req.json()

        const seller = await prisma.seller.update({
            where: { id: params.id },
            data: {
                name,
                contactInfo,
                status
            }
        })

        return NextResponse.json(seller)
    } catch (error) {
        console.error("Error updating seller:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "Super Admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await prisma.seller.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ message: "Seller deleted successfully" })
    } catch (error) {
        console.error("Error deleting seller:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
