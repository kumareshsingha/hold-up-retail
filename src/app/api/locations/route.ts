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

        const locations = await prisma.location.findMany({
            orderBy: { name: "asc" }
        })

        return NextResponse.json(locations)
    } catch (error) {
        console.error("Error fetching locations:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
