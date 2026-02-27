"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
    BarChart3,
    Package,
    ShoppingCart,
    Users,
    Settings,
    LogOut,
    Store,
    ArrowRightLeft
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3, roles: ["Super Admin", "Store Manager", "Cashier", "Inventory Manager"] },
    { name: "POS Terminal", href: "/dashboard/pos", icon: ShoppingCart, roles: ["Super Admin", "Store Manager", "Cashier"] },
    { name: "Inventory", href: "/dashboard/inventory", icon: Package, roles: ["Super Admin", "Store Manager", "Inventory Manager", "Warehouse Manager"] },
    { name: "Stock Transfers", href: "/dashboard/transfers", icon: ArrowRightLeft, roles: ["Super Admin", "Store Manager", "Warehouse Manager"] },
    { name: "Locations", href: "/dashboard/locations", icon: Store, roles: ["Super Admin"] },
    { name: "Customers", href: "/dashboard/customers", icon: Users, roles: ["Super Admin", "Store Manager", "Cashier"] },
    { name: "Reports & Analytics", href: "/dashboard/reports", icon: BarChart3, roles: ["Super Admin", "Store Manager"] },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["Super Admin"] },
]

export function Sidebar() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const userRole = session?.user?.role

    const filteredNavigation = navigation.filter((item) =>
        !userRole || item.roles.includes(userRole)
    )

    return (
        <div className="flex h-full w-64 flex-col bg-white border-r border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
            <div className="flex h-16 shrink-0 items-center px-6">
                <h1 className="text-xl font-bold text-[#4c1d95] truncate">Hold Up Retail</h1>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto">
                <nav className="flex-1 space-y-1 px-4 py-4">
                    {filteredNavigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    isActive
                                        ? "bg-[#4c1d95]/10 text-[#4c1d95] dark:bg-[#4c1d95]/20 dark:text-[#a78bfa]"
                                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-white",
                                    "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        isActive
                                            ? "text-[#4c1d95] dark:text-[#a78bfa]"
                                            : "text-zinc-400 group-hover:text-zinc-500 dark:text-zinc-500 dark:group-hover:text-zinc-400",
                                        "mr-3 h-5 w-5 shrink-0"
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>
            <div className="shrink-0 border-t border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex items-center px-1 mb-4">
                    <div className="truncate">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{session?.user?.name}</p>
                        <p className="text-xs text-zinc-500 truncate">{session?.user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                >
                    <LogOut className="mr-3 h-5 w-5 shrink-0 text-red-400 group-hover:text-red-500" aria-hidden="true" />
                    Sign out
                </button>
            </div>
        </div>
    )
}
