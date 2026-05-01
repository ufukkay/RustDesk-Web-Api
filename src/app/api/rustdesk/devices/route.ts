import { NextResponse } from "next/server";

export async function GET() {
  // Bu rota ileride store'daki host ve token bilgilerini kullanarak 
  // gerçek RustDesk API'sine (192.168.0.184:3000) bağlanacak.
  // Şimdilik altyapıyı hazırlıyoruz.
  
  try {
    // Örnek: Gerçek RustDesk sunucuna istek atma mantığı
    // const res = await fetch("http://192.168.0.184:3000/api/devices", {
    //   headers: { "Authorization": `Bearer ${token}` }
    // });
    // const data = await res.json();

    // Şimdilik boş liste döndürüyoruz, ayarlar yapıldığında burası dolacak.
    return NextResponse.json([]);
  } catch (error) {
    return NextResponse.json({ error: "Sunucuya bağlanılamadı" }, { status: 500 });
  }
}
