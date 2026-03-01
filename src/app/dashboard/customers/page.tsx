import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default async function CustomersPage() {
    const session = await getServerSession(authOptions)
    if (!session || !["Super Admin", "Store Manager", "Cashier"].includes(session.user?.role as string)) {
        redirect("/dashboard")
    }

    const customers = await prisma.customer.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            _count: {
                select: { transactions: true }
            },
            transactions: {
                select: { totalAmount: true }
            }
        }
    })

    const customerStats = customers.map((c: any) => {
        const lifetimeValue = c.transactions.reduce((acc: number, curr: any) => acc + curr.totalAmount, 0)
        return {
            ...c,
            lifetimeValue
        }
    })

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Customers
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Manage your customer database and view purchase history.
                </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <Table>
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                        <TableRow>
                            <TableHead>Customer Info</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead className="text-right">Loyalty Points</TableHead>
                            <TableHead className="text-right">Orders</TableHead>
                            <TableHead className="text-right">Lifetime Value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customerStats.map((customer: any) => (
                            <TableRow key={customer.id}>
                                <TableCell>
                                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{customer.name}</div>
                                    <div className="text-xs text-zinc-500">Joined: {new Date(customer.createdAt).toLocaleDateString()}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">{customer.email || "N/A"}</div>
                                    <div className="text-xs text-zinc-500">{customer.phone || "N/A"}</div>
                                </TableCell>
                                <TableCell className="text-right font-medium text-[#55142a] dark:text-[#a78bfa]">
                                    {customer.loyaltyPoints}
                                </TableCell>
                                <TableCell className="text-right">{customer._count.transactions}</TableCell>
                                <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                                    ₹{customer.lifetimeValue.toLocaleString("en-IN")}
                                </TableCell>
                            </TableRow>
                        ))}
                        {customerStats.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-zinc-500 py-8">
                                    No customers found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
