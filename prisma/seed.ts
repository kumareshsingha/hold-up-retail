import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // Create Roles
    const superAdminRole = await prisma.role.upsert({
        where: { name: 'Super Admin' },
        update: {},
        create: {
            name: 'Super Admin',
            permissions: JSON.stringify(['ALL']),
        },
    })

    const sellerRole = await prisma.role.upsert({
        where: { name: 'Seller' },
        update: {},
        create: {
            name: 'Seller',
            permissions: JSON.stringify(['POS', 'INVENTORY', 'CUSTOMERS', 'REPORTS']),
        },
    })

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const adminEmail = 'admin@holdup.com'

    const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            name: 'Super Admin',
            email: adminEmail,
            password: hashedPassword,
            roleId: superAdminRole.id,
        },
    })

    console.log(`Created admin user: ${adminEmail} / admin123`)

    // Default Seller
    const defaultSeller = await prisma.seller.upsert({
        where: { name: 'Main HQ' },
        update: {},
        create: {
            name: 'Main HQ',
            contactInfo: 'admin@holdup.com',
            status: 'ACTIVE'
        }
    })

    console.log('Seeding completed.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
