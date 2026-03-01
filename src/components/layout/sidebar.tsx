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
        <div className="flex h-full w-64 flex-col bg-[#55142a] text-[#fff3e3] border-r border-[#6f1b37] dark:bg-[#3f0f1f] dark:border-[#55142a]">
            <div className="flex h-16 shrink-0 items-center px-6">
                <h1 className="text-xl font-bold text-[#fff3e3] truncate">Craftomania</h1>
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
                                        ? "bg-[#fff3e3]/10 text-white dark:bg-[#fff3e3]/20 dark:text-white"
                                        : "text-[#fff3e3]/80 hover:bg-[#fff3e3]/5 hover:text-white dark:text-[#fff3e3]/60 dark:hover:bg-white/10 dark:hover:text-white",
                                    "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        isActive
                                            ? "text-[#fff3e3] dark:text-[#fff3e3]"
                                            : "text-[#fff3e3]/70 group-hover:text-[#fff3e3] dark:text-[#fff3e3]/60 dark:group-hover:text-[#fff3e3]",
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
            <div className="shrink-0 border-t border-[#6f1b37] p-4 dark:border-[#55142a]">
                <div className="flex items-center px-1 mb-4">
                    <div className="truncate">
                        <p className="text-sm font-medium text-[#fff3e3] dark:text-white">{session?.user?.name}</p>
                        <p className="text-xs text-[#fff3e3]/70 truncate">{session?.user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-[#fff3e3]/80 hover:bg-[#6f1b37] hover:text-[#fff3e3] dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                >
                    <LogOut className="mr-3 h-5 w-5 shrink-0 text-[#fff3e3]/80 group-hover:text-[#fff3e3]" aria-hidden="true" />
                    Sign out
                </button>
            </div>
        </div>
    )
}
