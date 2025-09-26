import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import '@fontsource/inter'
import { ReactNode } from "react"
import { cookies } from "next/headers"
import { jwtDecode } from "jwt-decode"
import LogoutButton from "@/components/LogoutButton"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Vet'Sentrum App",
  description: "Nuestro compromiso... salvar vidas",
}

type UserPayload = {
  name?: string
  rol?: "admin" | "recepcion" | "veterinario"
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  let user: UserPayload = { name: "Invitado", rol: undefined }

  if (token) {
    try {
      user = jwtDecode<UserPayload>(token)
    } catch (err) {
      console.error("Error decodificando token:", err)
    }
  }

  return (
    <div className="flex h-screen">
      {/* Barra lateral */}
      <aside className="w-48 bg-gray-900 text-white flex flex-col p-4">
        <h1 className="text-2xl font-bold mb-8">Vet&apos;Sentrum</h1>
        <nav className="flex flex-col gap-4">
          <a href="/dashboard" className="p-3 rounded-lg hover:bg-gray-800">Dashboard</a>

          {/* Solo visible si es admin */}
          {user.rol === "admin" && (
            <a href="/usuarios" className="p-3 rounded-lg hover:bg-gray-800">Usuarios</a>
          )}

          {/* Visible para admin y recepcion */}
          {(user.rol === "admin" || user.rol === "recepcion" || user.rol === "veterinario") && (
            <a href="/clientes" className="p-3 rounded-lg hover:bg-gray-800">Clientes</a>
          )}

          {/* Visible para admin y recepcion veterinario */}
          {(user.rol === "admin" || user.rol === "recepcion" || user.rol === "veterinario") && (
            <a href="/mascotas" className="p-3 rounded-lg hover:bg-gray-800">Mascotas</a>
          )}

          {/* Visible para admin y recepcion veterinario */}
          {(user.rol === "admin" || user.rol === "recepcion" || user.rol === "veterinario") && (
            <a href="/citas" className="p-3 rounded-lg hover:bg-gray-800">Citas</a>
          )}

          {/* Visible para admin y veterinario */}
          {(user.rol === "admin" || user.rol === "veterinario") && (
            <a href="/consultas" className="p-3 rounded-lg hover:bg-gray-800">Consultas</a>
          )}
        </nav>
      </aside>

      {/* Contenedor principal */}
      <div className="flex-1 flex flex-col">
        <header className="h-[60px] bg-white border-b flex items-center justify-end px-6 shadow-sm">
          <span className="mr-4 text-gray-700">{user.name ?? "Usuario"}</span>
          <LogoutButton />
        </header>
        <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}