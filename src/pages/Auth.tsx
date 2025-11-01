import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isResetPassword, setIsResetPassword] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isResetPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
        setIsResetPassword(false);
        setIsLogin(true);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast.success("Cadastro realizado! Faça login para continuar.");
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao realizar operação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl">
              GP
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Gestão PRO</CardTitle>
          <CardDescription className="text-center">
            {isResetPassword
              ? "Digite seu email para recuperar a senha"
              : isLogin
              ? "Entre com suas credenciais para acessar o sistema"
              : "Crie sua conta para começar"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {!isResetPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading 
                ? "Processando..." 
                : isResetPassword 
                ? "Enviar Email de Recuperação" 
                : isLogin 
                ? "Entrar" 
                : "Cadastrar"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm space-y-2">
            {!isResetPassword && (
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline block w-full"
              >
                {isLogin
                  ? "Não tem uma conta? Cadastre-se"
                  : "Já tem uma conta? Faça login"}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsResetPassword(!isResetPassword);
                setIsLogin(false);
              }}
              className="text-primary hover:underline block w-full"
            >
              {isResetPassword ? "Voltar para login" : "Esqueci minha senha"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
