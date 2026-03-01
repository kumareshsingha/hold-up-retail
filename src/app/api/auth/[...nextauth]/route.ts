import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials")
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: { role: true }
                })

                if (!user) {
                    throw new Error("User not found")
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

                if (!isPasswordValid) {
                    throw new Error("Invalid password")
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role.name,
                    sellerId: user.sellerId
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.sellerId = user.sellerId
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.sellerId = token.sellerId as string | null
            }
            return session
        }
    },
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
