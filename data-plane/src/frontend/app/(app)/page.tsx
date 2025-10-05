import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function Page() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value
  
  if (accessToken) {
    redirect("/dashboard")
  } else {
    redirect("/login")
  }
}
