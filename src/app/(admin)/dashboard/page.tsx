'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios';

type Rol = 'admin' | 'veterinario' | 'recepcion' | string

export default function DashboardPage() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rol, setRol] = useState<Rol | null>(null)
  const router = useRouter()

  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, {
        withCredentials: true,
      })
      .then((res) => {
        const usuario = res.data;
        setUsuario(usuario);
        setRol(usuario.rol);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Token inválido:', err);
        router.push('/login');
      });
  }, [])

  if (!rol) return null

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-100 p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <img src="/vet_shadows.png" alt="Vet'Sentrum Logo" />
      </div>
    </main>
  )
}