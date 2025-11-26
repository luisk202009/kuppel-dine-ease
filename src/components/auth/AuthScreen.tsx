import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, Zap, Mail, UserPlus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logo } from '@/components/ui/logo';
import { CompanySelection } from '@/components/auth/CompanySelection';
import { useSignUp, useResetPassword, useMagicLink } from '@/hooks/useAuth';
import { usePOS } from '@/contexts/POSContext';
import { useToast } from '@/hooks/use-toast';
import { shouldUseMockData } from '@/config/environment';
import { ThemeSelector } from '@/components/common/ThemeSelector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
export const AuthScreen: React.FC = () => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const {
    authState,
    login,
    selectCompanyAndBranch
  } = usePOS();
  const signUpMutation = useSignUp();
  const resetPasswordMutation = useResetPassword();
  const magicLinkMutation = useMagicLink();
  const {
    toast
  } = useToast();

  // Show company selection if needed
  if (authState.needsCompanySelection) {
    return <CompanySelection companies={authState.companies} branches={authState.branches} onSelect={selectCompanyAndBranch} />;
  }
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast({
        title: "Error",
        description: "Por favor ingresa email y contraseña",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      const success = await login(loginEmail, loginPassword);
      if (!success) {
        toast({
          title: "Error de autenticación",
          description: "Email o contraseña incorrectos. Intenta de nuevo.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "¡Bienvenido!",
          description: "Iniciando sesión..."
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "Error al conectar con el servidor. Revisa tu conexión.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu email",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await resetPasswordMutation.mutateAsync(resetEmail);
      setShowResetDialog(false);
      setResetEmail('');
    } catch (error) {
      console.error('Reset password error:', error);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = magicLinkEmail || loginEmail;
    
    if (!email) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu email",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await magicLinkMutation.mutateAsync(email);
      setMagicLinkEmail('');
    } catch (error) {
      console.error('Magic link error:', error);
    }
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword || !signupName) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }
    if (signupPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      await signUpMutation.mutateAsync({
        email: signupEmail,
        password: signupPassword,
        name: signupName
      });

      // Switch to login tab after successful signup
      setActiveTab('login');
      setSignupEmail('');
      setSignupPassword('');
      setSignupName('');
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      const success = await login('demo@kuppel.co', 'demo123456');
      if (success) {
        toast({
          title: "¡Modo Demo Activado!",
          description: "Bienvenido al sistema de demostración"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al iniciar modo demo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 flex items-center justify-center p-4 relative">
      {/* Theme Selector - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeSelector />
      </div>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      </div>

      <Card className="w-full max-w-md pos-card relative">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo width={180} height={60} />
          </div>
          <div>
            
            <CardDescription className="text-muted-foreground mt-2">
              Accede a tu cuenta o regístrate
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Iniciar</TabsTrigger>
                  <TabsTrigger value="signup">Registro</TabsTrigger>
                </TabsList>
            
            <TabsContent value="login" className="space-y-4 mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="login-email" type="email" placeholder="tu@email.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="pl-10 h-11" disabled={isLoading} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="login-password" type={showPassword ? "text" : "password"} placeholder="Tu contraseña" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="pl-10 pr-10 h-11" disabled={isLoading} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground" disabled={isLoading}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-sm text-primary hover:underline"
                      >
                        ¿Olvidó su contraseña?
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Recuperar contraseña</DialogTitle>
                        <DialogDescription>
                          Ingrese su email y le enviaremos un enlace para restablecer su contraseña.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reset-email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="tu@email.com"
                              className="pl-10 h-11"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              disabled={resetPasswordMutation.isPending}
                              required
                            />
                          </div>
                        </div>
                        <Button
                          type="submit"
                          className="w-full h-11"
                          disabled={resetPasswordMutation.isPending}
                        >
                          {resetPasswordMutation.isPending ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Enviando...</span>
                            </div>
                          ) : (
                            "Enviar enlace de recuperación"
                          )}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verificando credenciales...</span>
                    </div> : 'Iniciar Sesión'}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">o</span>
                </div>
              </div>

              <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="magic-email">Iniciar sesión sin contraseña</Label>
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="magic-email"
                      type="email"
                      placeholder={loginEmail || "tu@email.com"}
                      className="pl-10 h-11"
                      value={magicLinkEmail}
                      onChange={(e) => setMagicLinkEmail(e.target.value)}
                      disabled={magicLinkMutation.isPending}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recibirás un enlace mágico en tu email para iniciar sesión
                  </p>
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full h-11"
                  disabled={magicLinkMutation.isPending}
                >
                  {magicLinkMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Enviando enlace...</span>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Iniciar con Magic Link
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nombre</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="signup-name" type="text" placeholder="Tu nombre" value={signupName} onChange={e => setSignupName(e.target.value)} className="pl-10 h-11" disabled={isLoading} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="signup-email" type="email" placeholder="tu@email.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} className="pl-10 h-11" disabled={isLoading} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="signup-password" type={showSignupPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} className="pl-10 pr-10 h-11" disabled={isLoading} />
                    <button type="button" onClick={() => setShowSignupPassword(!showSignupPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground" disabled={isLoading}>
                      {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-11" disabled={isLoading || signUpMutation.isPending}>
                  {isLoading || signUpMutation.isPending ? <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creando cuenta...</span>
                    </div> : <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Crear Cuenta
                    </>}
                </Button>
              </form>
            </TabsContent>

          </Tabs>

          {/* Demo Login Button */}
          {shouldUseMockData() && <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    o
                  </span>
                </div>
              </div>
              
              <Button type="button" variant="outline" className="w-full h-11 mt-4" onClick={handleDemoLogin} disabled={isLoading}>
                <Zap className="w-4 h-4 mr-2" />
                Entrar en modo demo
              </Button>
            </div>}
        </CardContent>
      </Card>
    </div>;
};
export default AuthScreen;