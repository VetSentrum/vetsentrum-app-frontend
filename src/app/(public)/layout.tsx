import type { Metadata } from 'next'
import '../globals.css'
import '@fontsource/inter'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: "Check-in — Vet'Sentrum",
  description: 'Registro de llegada para pacientes',
}

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
