import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Lock, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/contexts/LocaleContext";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function Landing() {
  const { loginMutation, user } = useAuth();
  const { t } = useLocale();
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });

  // Fetch login banner URL
  const { data: loginBannerData } = useQuery<{ url: string | null }>({
    queryKey: ["/api/public/login-banner"],
    queryFn: async () => {
      const res = await fetch("/api/public/login-banner");
      if (!res.ok) {
        console.warn("⚠️ Failed to fetch login banner:", res.status);
        return { url: null };
      }
      const data = await res.json();
      console.log("🔵 Login banner data fetched:", data);
      return data;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Get banner image URL
  const bannerImageUrl = loginBannerData?.url || null;
  
  console.log("🔵 Current banner image URL:", bannerImageUrl);

  // If user is already logged in, don't render the landing/login
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-8 h-8 animate-spin mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <p>{t('redirecting')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(credentials);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0 bg-transparent">
            <CardHeader className="space-y-1 text-center pb-8 px-0">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
                <Sparkles className="w-8 h-8 text-white relative z-10" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
                {t('welcome_back')}
              </CardTitle>
              <CardDescription className="text-slate-600 text-base">
                {t('enter_credentials')}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 px-0">
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Username field */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-700 font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-pink-500" />
                    {t('username')}
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Digite seu usuário"
                    required
                    className="bg-white border-pink-200 text-slate-900 placeholder:text-slate-400 h-12 focus:bg-white focus:border-pink-500 focus:ring-pink-500/20 transition-all shadow-sm"
                    disabled={loginMutation.isPending}
                  />
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4 text-pink-500" />
                    {t('password')}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Digite sua senha"
                    required
                    className="bg-white border-pink-200 text-slate-900 placeholder:text-slate-400 h-12 focus:bg-white focus:border-pink-500 focus:ring-pink-500/20 transition-all shadow-sm"
                    disabled={loginMutation.isPending}
                  />
                </div>

                {/* Submit button */}
                <Button 
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-rose-600 hover:shadow-xl hover:shadow-pink-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                  size="lg"
                  disabled={loginMutation.isPending}
                  style={{
                    boxShadow: '0 8px 24px rgba(236, 72, 153, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-rose-400/20 backdrop-blur-sm"></div>
                  <span className="relative z-10">
                    {loginMutation.isPending ? (
                      <span className="flex items-center gap-2 justify-center">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('logging_in')}
                      </span>
                    ) : (
                      t('login_button')
                    )}
                  </span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Banner */}
      <div className="flex-1 relative hidden lg:flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 overflow-hidden">
        {bannerImageUrl ? (
          <div className="absolute inset-0">
            <img 
              src={bannerImageUrl} 
              alt="Banner de login"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800"></div>
        )}
      </div>
    </div>
  );
}
