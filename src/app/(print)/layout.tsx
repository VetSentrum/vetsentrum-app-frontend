import type { Metadata } from "next"
import { ReactNode } from "react"
import "../(admin)/globals.css"
import '@fontsource/inter'

export const metadata: Metadata = {
  title: "Vet'Sentrum App",
  description: "Nuestro compromiso... salvar vidas",
}

export default function PrintLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white">
      {children}
    </div>
  )
}
