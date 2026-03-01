import NextAuth, { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: string
            sellerId: string | null
        } & DefaultSession["user"]
    }

    interface User extends DefaultUser {
        id: string
        role: string
        sellerId: string | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: string
        sellerId: string | null
    }
}
