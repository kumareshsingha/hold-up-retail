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

    // Default Location
    const HQ = await prisma.location.upsert({
        where: { name: 'Main HQ' },
        update: {},
        create: {
            name: 'Main HQ',
            type: 'Warehouse',
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
