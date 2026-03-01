"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Minus, Trash, ShoppingCart, CreditCard, Printer } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Product = {
    id: string
    name: string
    sku: string
    sellingPrice: number
    taxPct: number
    inventory: { quantity: number; location: { id: string } }[]
}

type CartItem = Product & {
    cartQuantity: number
}

export default function POSPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [cart, setCart] = useState<CartItem[]>([])

    const [locations, setLocations] = useState<{ id: string, name: string }[]>([])
    const [selectedLocation, setSelectedLocation] = useState("")
    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
    const [receiptData, setReceiptData] = useState<{ transactionId: string, items: CartItem[], total: number, tax: number, subtotal: number, date: Date } | null>(null)

    // Load products & locations
    useEffect(() => {
        async function fetchData() {
            try {
                const [prodRes, locRes] = await Promise.all([
                    fetch("/api/products"),
                    fetch("/api/locations")
                ])
                if (prodRes.ok) setProducts(await prodRes.json())
                if (locRes.ok) {
                    const locs = await locRes.json()
                    setLocations(locs)
                    if (locs.length > 0) setSelectedLocation(locs[0].id)
                }
            } catch (error) {
                console.error("Failed to load POS data", error)
            }
        }
        fetchData()
    }, [])

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id)
            if (existing) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
                )
            }
            return [...prev, { ...product, cartQuantity: 1 }]
        })
    }

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.id === productId) {
                    const newQty = item.cartQuantity + delta
                    if (newQty <= 0) return null // handle removal later or let it be 0
                    return { ...item, cartQuantity: newQty }
                }
                return item
            }).filter(Boolean) as CartItem[]
        })
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId))
    }

    const calculateTotals = () => {
        const subtotal = cart.reduce((acc, item) => acc + (item.sellingPrice * item.cartQuantity), 0)
        // Assume tax is calculated per item based on default sellingPrice. 
        // Usually sellingPrice might be tax inclusive/exclusive. Assuming exclusive here.
        const tax = cart.reduce((acc, item) => acc + (item.sellingPrice * item.cartQuantity * (item.taxPct / 100)), 0)
        const total = subtotal + tax
        return { subtotal, tax, total }
    }

    const { subtotal, tax, total } = calculateTotals()

    const handleCheckout = async () => {
        if (!selectedLocation) {
            alert("Please select a store location first.")
            return
        }

        setIsCheckoutLoading(true)
        try {
            const res = await fetch("/api/pos/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cart,
                    paymentMethod: "CASH", // Future: add payment method selection UI
                    locationId: selectedLocation,
                    totalAmount: total,
                })
            })

            if (res.ok) {
                const data = await res.json()
                setReceiptData({
                    transactionId: data.transactionId,
                    items: [...cart],
                    total,
                    tax,
                    subtotal,
                    date: new Date()
                })
                setCart([]) // Clear Cart
            } else {
                const error = await res.json()
                alert(error.error || "Failed to process checkout")
            }
        } catch (e) {
            console.error(e)
            alert("A network error occurred during checkout.")
        } finally {
            setIsCheckoutLoading(false)
        }
    }

    const handlePrintReceipt = () => {
        window.print()
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6 print:hidden">
            {/* Left side: Products Grid */}
            <div className="w-2/3 flex flex-col space-y-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search products by name or SKU / Scan Barcode..."
                        className="pl-9 h-12 text-lg rounded-xl border-zinc-300 dark:border-zinc-700"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            className="group cursor-pointer rounded-xl border border-zinc-200 bg-white p-4 hover:border-[#55142a] hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-[#6f1b37]"
                            onClick={() => addToCart(product)}
                        >
                            <div className="aspect-square bg-zinc-100 dark:bg-zinc-900 rounded-lg mb-3 flex items-center justify-center">
                                <ShoppingCart className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                            </div>
                            <h3 className="font-semibold text-zinc-900 dark:text-white line-clamp-1">{product.name}</h3>
                            <p className="text-sm text-zinc-500  dark:text-zinc-400 mb-2 truncate">SKU: {product.sku}</p>
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-[#55142a] dark:text-[#a78bfa]">₹{product.sellingPrice.toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full h-40 flex items-center justify-center text-zinc-500">
                            No products found matching "{searchQuery}"
                        </div>
                    )}
                </div>
            </div>

            {/* Right side: Cart Drawer */}
            <div className="w-1/3 flex flex-col rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-t-xl">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" /> Current Order
                        </h2>
                        <select
                            className="text-sm border border-zinc-300 dark:border-zinc-700 rounded p-1 bg-white dark:bg-zinc-950"
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                        >
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-3">
                            <ShoppingCart className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
                            <p>Your cart is empty</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex flex-col gap-2 p-3 border border-zinc-100 bg-zinc-50 dark:border-zinc-800/50 dark:bg-zinc-900/50 rounded-lg">
                                <div className="flex justify-between font-medium">
                                    <span className="truncate pr-2 text-zinc-900 dark:text-zinc-100">{item.name}</span>
                                    <span>₹{(item.sellingPrice * item.cartQuantity).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-zinc-500">₹{item.sellingPrice.toFixed(2)} each</span>
                                    <div className="flex items-center gap-3">
                                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" onClick={() => updateQuantity(item.id, -1)}>
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="text-sm font-semibold w-6 text-center">{item.cartQuantity}</span>
                                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" onClick={() => updateQuantity(item.id, 1)}>
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 ml-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => removeFromCart(item.id)}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Totals & Checkout */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-b-xl border-t border-zinc-200 dark:border-zinc-800">
                    <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                            <span>Tax (GST)</span>
                            <span>₹{tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t border-zinc-200 dark:border-zinc-800 pt-2 text-zinc-900 dark:text-zinc-100">
                            <span>Total</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>
                    </div>

                    <Button
                        className="w-full h-14 text-lg bg-[#55142a] hover:bg-[#6f1b37] text-white"
                        disabled={cart.length === 0 || isCheckoutLoading}
                        onClick={handleCheckout}
                    >
                        <CreditCard className="mr-2 h-5 w-5" /> {isCheckoutLoading ? "Processing..." : "Checkout & Pay"}
                    </Button>
                </div>
            </div>

            {/* Receipt Modal (Hidden by default, visible when receiptData is set) */}
            <Dialog open={!!receiptData} onOpenChange={(open) => { if (!open) setReceiptData(null) }}>
                <DialogContent className="max-w-md sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-center font-bold text-xl uppercase tracking-wider">Receipt</DialogTitle>
                    </DialogHeader>
                    {receiptData && (
                        <div className="space-y-4" id="print-receipt-area">
                            <div className="text-center space-y-1 pb-4 border-b border-zinc-200 border-dashed dark:border-zinc-800">
                                <h3 className="font-bold text-lg">Craftomania</h3>
                                <p className="text-sm text-zinc-500">{locations.find(l => l.id === selectedLocation)?.name}</p>
                                <p className="text-xs text-zinc-500">{receiptData.date.toLocaleString()}</p>
                            </div>

                            <div className="space-y-2 py-2">
                                <div className="flex justify-between text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-200 pb-2 dark:border-zinc-800">
                                    <span>Item</span>
                                    <span>Qty</span>
                                    <span>Amount</span>
                                </div>
                                {receiptData.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm py-1">
                                        <span className="truncate pr-2 w-1/2">{item.name}</span>
                                        <span className="w-1/4 text-center">{item.cartQuantity}</span>
                                        <span className="w-1/4 text-right">₹{(item.sellingPrice * item.cartQuantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-zinc-200 border-dashed pt-4 space-y-2 dark:border-zinc-800">
                                <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                                    <span>Subtotal</span>
                                    <span>₹{receiptData.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                                    <span>Tax (GST)</span>
                                    <span>₹{receiptData.tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2">
                                    <span>Total</span>
                                    <span>₹{receiptData.total.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="text-center text-xs text-zinc-500 pt-4">
                                <p>Transaction ID: {receiptData.transactionId}</p>
                                <p className="mt-2 font-medium">Thank you for your purchase!</p>
                            </div>

                            <div className="pt-6 print:hidden">
                                <Button className="w-full" onClick={handlePrintReceipt}>
                                    <Printer className="mr-2 h-4 w-4" /> Print Receipt
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Print-only markup so the receipt prints alone */}
            {receiptData && (
                <div className="hidden print:block fixed inset-0 bg-white z-50 p-8 text-black" style={{ width: '80mm', margin: '0 auto' }}>
                    <div className="text-center space-y-1 pb-4 border-b border-black border-dashed">
                        <h3 className="font-bold text-lg">Craftomania</h3>
                        <p className="text-sm">{locations.find(l => l.id === selectedLocation)?.name}</p>
                        <p className="text-xs">{receiptData.date.toLocaleString()}</p>
                    </div>

                    <div className="space-y-2 py-4">
                        <div className="flex justify-between text-xs font-semibold uppercase tracking-wider border-b border-black pb-2">
                            <span>Item</span>
                            <span>Qty</span>
                            <span>Amount</span>
                        </div>
                        {receiptData.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm py-1">
                                <span className="truncate pr-2 w-1/2">{item.name}</span>
                                <span className="w-1/4 text-center">{item.cartQuantity}</span>
                                <span className="w-1/4 text-right">₹{(item.sellingPrice * item.cartQuantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-black border-dashed pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Subtotal</span>
                            <span>₹{receiptData.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Tax (GST)</span>
                            <span>₹{receiptData.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2">
                            <span>Total</span>
                            <span>₹{receiptData.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="text-center text-xs pt-4">
                        <p>Txn: {receiptData.transactionId}</p>
                        <p className="mt-2 font-medium">Thank you for your purchase!</p>
                    </div>
                </div>
            )}
        </div>
    )
}
