import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

export default function Landing() {
  const { loginMutation, user } = useAuth();
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });

  // If user is already logged in, don't render the login form
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-8 h-8 animate-spin mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <p>Redirecionando para o dashboard...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Estética Pro</h1>
            <p className="text-slate-600">
              Sistema de gestão completo para profissionais da estética
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Digite seu usuário"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Digite sua senha"
                required
              />
            </div>
            
            <Button 
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-medium"
              size="lg"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar na Plataforma"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Credenciais padrão: admin / admin
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
