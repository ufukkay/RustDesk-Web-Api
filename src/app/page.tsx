import { redirect } from "next/navigation";

export default function Home() {
  // Varsayılan olarak dashboard'a yönlendiriyoruz
  redirect("/dashboard");
}
