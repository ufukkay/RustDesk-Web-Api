"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MonitorPlay, Lock, User, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simüle edilmiş login süreci
    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
      
      <div className="relative w-full max-w-md p-4">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.5)]">
            <MonitorPlay className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Teknisyen Portalı</h1>
          <p className="text-muted-foreground mt-2">Cihazlarınızı uzaktan yönetin</p>
        </div>

        <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl text-center text-white">Giriş Yap</CardTitle>
            <CardDescription className="text-center">
              Devam etmek için bilgilerinizi giriniz
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300">Kullanıcı Adı</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                  <Input 
                    id="username" 
                    placeholder="admin" 
                    className="pl-10 bg-white/5 border-white/10 text-white focus:ring-primary/50" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-300">Şifre</Label>
                  <a href="#" className="text-xs text-primary hover:underline">Şifremi Unuttum?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 bg-white/5 border-white/10 text-white focus:ring-primary/50" 
                    required 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isLoading}>
                {isLoading ? (
                  "Giriş yapılıyor..."
                ) : (
                  <>
                    Sisteme Gir <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <p className="text-center text-xs text-gray-500 mt-8">
          &copy; {new Date().getFullYear()} RustDesk Yönetim Sistemi
        </p>
      </div>
    </div>
  );
}
