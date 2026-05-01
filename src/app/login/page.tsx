"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MonitorPlay, Lock, User, ArrowRight, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAppStore();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login(username || "admin");
      router.push("/dashboard");
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="absolute inset-0 bg-blue-50/50" />
      
      <div className="relative w-full max-w-md p-6">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/20">
            <MonitorPlay className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Teknisyen Portalı</h1>
          <p className="text-slate-500 mt-2 font-medium">RustDesk Kurumsal Yönetim Sistemi</p>
        </div>

        <Card className="bg-white shadow-xl shadow-slate-200/50 border-slate-200">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center text-slate-900 font-bold">Giriş Yap</CardTitle>
            <CardDescription className="text-center text-slate-500">
              Devam etmek için bilgilerinizi giriniz
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-700 font-semibold">Kullanıcı Adı</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <Input 
                    id="username" 
                    placeholder="Kullanıcı adınız..." 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-blue-600 h-11" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-700 font-semibold">Şifre</Label>
                  <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">Şifremi Unuttum?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-blue-600 h-11" 
                    required 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-base font-semibold shadow-md shadow-blue-600/20" disabled={isLoading}>
                {isLoading ? (
                  "Giriş yapılıyor..."
                ) : (
                  <>
                    Sisteme Gir <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500 font-medium bg-slate-50 p-3 rounded-lg w-full">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Güvenli Bağlantı
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
