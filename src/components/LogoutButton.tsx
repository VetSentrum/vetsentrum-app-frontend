"use client"

import { UserIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import axios from "axios"

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/logout`, null, {
        withCredentials: true,
      })
      router.push('/login')
    } catch (err) {
      console.error("Error al cerrar sesión:", err)
    }
  }

  return (
    <button onClick={handleLogout} className="p-2 rounded-full hover:bg-gray-100">
      <UserIcon size={20} />
    </button>
  )
}