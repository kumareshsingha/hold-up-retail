import { withAuth } from "next-auth/middleware"

export default withAuth({
    callbacks: {
        authorized: ({ req, token }) => {
            // Protect dashboard routes
            if (req.nextUrl.pathname.startsWith("/dashboard")) {
                return token !== null
            }
            return true
        },
    },
})

export const config = {
    matcher: ["/dashboard/:path*"],
}
