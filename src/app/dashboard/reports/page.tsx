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

export default async function ReportsPage() {
    const session = await getServerSession(authOptions)
    if (!session) redirect("/login")

    const isSeller = session.user.role === "Seller"
    const isSuperAdmin = session.user.role === "Super Admin"

    if (!isSuperAdmin && !isSeller) {
        redirect("/dashboard")
    }

    const where: any = {}
    if (isSeller) {
        where.sellerId = session.user.sellerId
    }

    // 1. Profit Margin Calculation (Sort by highest margin to lowest)
    const products = await prisma.product.findMany({
        where,
        select: {
            id: true,
            name: true,
            sku: true,
            costPrice: true,
            sellingPrice: true
        }
    })

    const profitMargins = products.map(p => {
        const profit = p.sellingPrice - p.costPrice
        const marginPct = p.sellingPrice > 0 ? (profit / p.sellingPrice) * 100 : 0
        return { ...p, profit, marginPct }
    }).sort((a, b) => b.marginPct - a.marginPct)

    // 2. Dead Stock Analysis (Products with inventory but no recent sales)
    // For simplicity, we define "dead stock" as stuff with inventory > 0 but 0 total transactions
    const deadStockProducts = await prisma.product.findMany({
        where: {
            ...where,
            stock: { gt: 0 },
            transactions: {
                none: {} // Has no transaction items
            }
        },
        select: {
            id: true,
            name: true,
            sku: true,
            costPrice: true,
            stock: true
        }
    })

    const deadStock = deadStockProducts.map(p => {
        const deadCapital = p.stock * p.costPrice
        return { ...p, totalStock: p.stock, deadCapital }
    }).sort((a, b) => b.deadCapital - a.deadCapital)

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Analytics & Reports
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Deep dive into profit margins and inactive stock holding capital.
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Profit Margins */}
                <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 flex flex-col h-[500px]">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Profit Margins (Top 50)</h3>
                        <p className="text-sm text-zinc-500">Items sorted by highest profit margin %.</p>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                                <TableRow>
                                    <TableHead>Product / SKU</TableHead>
                                    <TableHead className="text-right">Cost</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Margin %</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {profitMargins.slice(0, 50).map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium text-zinc-900 dark:text-zinc-100">{item.name}</div>
                                            <div className="text-xs text-zinc-500">{item.sku}</div>
                                        </TableCell>
                                        <TableCell className="text-right">₹{item.costPrice.toFixed(2)}</TableCell>
                                        <TableCell className="text-right text-[#55142a] dark:text-[#a78bfa] font-medium">₹{item.sellingPrice.toFixed(2)}</TableCell>
                                        <TableCell className="text-right text-green-600 dark:text-green-400 font-bold">{item.marginPct.toFixed(1)}%</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Dead Stock */}
                <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 flex flex-col h-[500px]">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Dead Stock holding Capital</h3>
                        <p className="text-sm text-zinc-500">Products with stock &gt; 0 but no sales history.</p>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Unsold Qty</TableHead>
                                    <TableHead className="text-right">Dead Capital</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {deadStock.slice(0, 50).map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium text-zinc-900 dark:text-zinc-100">{item.name}</div>
                                            <div className="text-xs text-zinc-500">{item.sku}</div>
                                        </TableCell>
                                        <TableCell className="text-right">{item.totalStock}</TableCell>
                                        <TableCell className="text-right text-red-600 dark:text-red-400 font-bold">
                                            ₹{item.deadCapital.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {deadStock.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-zinc-500 py-8">
                                            No dead stock found. Great job!
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    )
}
