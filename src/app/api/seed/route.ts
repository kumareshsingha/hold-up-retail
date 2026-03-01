import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from 'bcryptjs'

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        console.log('Seeding database remotely...')

        // Create Roles
        const superAdminRole = await prisma.role.upsert({
            where: { name: 'Super Admin' },
            update: {},
            create: {
                name: 'Super Admin',
                permissions: JSON.stringify(['ALL']),
            },
        })

        // Create default admin user
        const hashedPassword = await bcrypt.hash('admin123', 10)
        const adminEmail = 'admin@holdup.com'

        await prisma.user.upsert({
            where: { email: adminEmail },
            update: {},
            create: {
                name: 'Super Admin',
                email: adminEmail,
                password: hashedPassword,
                roleId: superAdminRole.id,
            },
        })

        // Default Seller
        await prisma.seller.upsert({
            where: { name: 'Main HQ' },
            update: {},
            create: {
                name: 'Main HQ',
                contactInfo: 'admin@holdup.com',
                status: 'ACTIVE'
            }
        })

        return NextResponse.json({
            success: true,
            message: "Production Database seeded successfully! You can now log in at /login with admin@holdup.com and password admin123"
        })
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 })
    }
}
