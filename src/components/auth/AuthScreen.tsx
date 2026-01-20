import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, Zap, Mail, UserPlus, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { cn } from '@/lib/utils';

// Glass Card Components for the Ecosystem

// Smart Receipt - Central floating receipt
const SmartReceipt = () => (
  <div className="absolute z-20 w-72 bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-5 animate-float">
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-kuppel-from to-kuppel-to" />
      <span className="text-xs text-zinc-500 font-mono">23 Ene 2026</span>
    </div>
    
    {/* Items (simulated bars) */}
    <div className="space-y-3 mb-6">
      <div className="flex justify-between items-center">
        <div className="h-2 w-24 bg-white/20 rounded-full" />
        <div className="h-2 w-12 bg-white/10 rounded-full" />
      </div>
      <div className="flex justify-between items-center">
        <div className="h-2 w-20 bg-white/20 rounded-full" />
        <div className="h-2 w-10 bg-white/10 rounded-full" />
      </div>
      <div className="flex justify-between items-center">
        <div className="h-2 w-28 bg-white/20 rounded-full" />
        <div className="h-2 w-14 bg-white/10 rounded-full" />
      </div>
    </div>
    
    {/* Footer - Paid Button */}
    <div className="w-full py-3 bg-[#C0D860] text-black font-semibold rounded-xl text-sm text-center">
      Paid €124.50
    </div>
  </div>
);

// Income Card - Floating top-left with bar chart
const IncomeCard = () => (
  <div 
    className="absolute z-10 -top-8 -left-8 w-40 h-32 bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-4 -rotate-6 opacity-80 animate-float"
    style={{ animationDelay: '-2s' }}
  >
    {/* Mini chart */}
    <div className="flex items-end gap-1 h-16">
      <div className="w-4 bg-white/20 rounded-t h-6" />
      <div className="w-4 bg-white/30 rounded-t h-10" />
      <div className="w-4 bg-kuppel-to rounded-t h-14" />
    </div>
    <div className="mt-2 text-xs text-zinc-400">Ingresos</div>
  </div>
);

// Security Shield - Floating bottom-right
const SecurityShield = () => (
  <div 
    className="absolute z-10 -bottom-4 -right-8 w-28 h-28 bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl flex items-center justify-center rotate-6 opacity-80 animate-float"
    style={{ animationDelay: '-4s' }}
  >
    <ShieldCheck className="h-12 w-12 text-white/80" />
  </div>
);

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
  const { toast } = useToast();

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

  const inputClassName = "h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-kuppel-from/50 focus:border-kuppel-from transition-all";

  return (
    <div className="h-screen w-full grid lg:grid-cols-2">
      {/* Left Panel - Form */}
      <div className="flex flex-col items-center justify-center p-8 lg:p-12 bg-background relative">
        {/* Theme Selector */}
        <div className="absolute top-4 right-4 z-20">
          <ThemeSelector />
        </div>

        <div className="w-full max-w-sm space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo width={160} height={54} />
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Bienvenido
            </h1>
            <p className="text-sm text-muted-foreground">
              Accede a tu cuenta o crea una nueva
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-11">
              <TabsTrigger value="login" className="h-9">Iniciar</TabsTrigger>
              <TabsTrigger value="signup" className="h-9">Registro</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="login-email" 
                      type="email" 
                      placeholder="tu@email.com" 
                      value={loginEmail} 
                      onChange={e => setLoginEmail(e.target.value)} 
                      className={cn("pl-10", inputClassName)} 
                      disabled={isLoading} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="login-password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Tu contraseña" 
                      value={loginPassword} 
                      onChange={e => setLoginPassword(e.target.value)} 
                      className={cn("pl-10 pr-10", inputClassName)} 
                      disabled={isLoading} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" 
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-sm text-kuppel-from hover:text-kuppel-to transition-colors"
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
                              className={cn("pl-10", inputClassName)}
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              disabled={resetPasswordMutation.isPending}
                              required
                            />
                          </div>
                        </div>
                        <Button
                          type="submit"
                          className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-medium"
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

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-medium" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verificando...</span>
                    </div>
                  ) : 'Iniciar Sesión'}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-200 dark:border-zinc-700" />
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
                      className={cn("pl-10", inputClassName)}
                      value={magicLinkEmail}
                      onChange={(e) => setMagicLinkEmail(e.target.value)}
                      disabled={magicLinkMutation.isPending}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recibirás un enlace mágico en tu email
                  </p>
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full h-12 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  disabled={magicLinkMutation.isPending}
                >
                  {magicLinkMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Enviando...</span>
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

            <TabsContent value="signup" className="space-y-4 mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nombre</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="signup-name" 
                      type="text" 
                      placeholder="Tu nombre" 
                      value={signupName} 
                      onChange={e => setSignupName(e.target.value)} 
                      className={cn("pl-10", inputClassName)} 
                      disabled={isLoading} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="signup-email" 
                      type="email" 
                      placeholder="tu@email.com" 
                      value={signupEmail} 
                      onChange={e => setSignupEmail(e.target.value)} 
                      className={cn("pl-10", inputClassName)} 
                      disabled={isLoading} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="signup-password" 
                      type={showSignupPassword ? "text" : "password"} 
                      placeholder="Mínimo 6 caracteres" 
                      value={signupPassword} 
                      onChange={e => setSignupPassword(e.target.value)} 
                      className={cn("pl-10 pr-10", inputClassName)} 
                      disabled={isLoading} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowSignupPassword(!showSignupPassword)} 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" 
                      disabled={isLoading}
                    >
                      {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-medium" 
                  disabled={isLoading || signUpMutation.isPending}
                >
                  {isLoading || signUpMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creando cuenta...</span>
                    </div>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Crear Cuenta
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Demo Login Button */}
          {shouldUseMockData() && (
            <div className="pt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-200 dark:border-zinc-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    demo
                  </span>
                </div>
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-12 mt-4 border-zinc-200 dark:border-zinc-700" 
                onClick={handleDemoLogin} 
                disabled={isLoading}
              >
                <Zap className="w-4 h-4 mr-2" />
                Entrar en modo demo
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Glass Ecosystem (Desktop Only) */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-[#09090B] relative overflow-hidden">
        {/* Central Aurora Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,_rgba(192,216,96,0.25)_0%,_rgba(74,183,198,0.15)_40%,_transparent_70%)] blur-3xl" />
        
        {/* Noise texture */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />

        {/* Glass Ecosystem Container */}
        <div className="relative z-10 w-full h-[500px] flex items-center justify-center">
          {/* Income Card - Top Left */}
          <IncomeCard />
          
          {/* Smart Receipt - Center */}
          <SmartReceipt />
          
          {/* Security Shield - Bottom Right */}
          <SecurityShield />
        </div>

        {/* Inspirational Text */}
        <div className="absolute bottom-16 left-0 right-0 px-12 z-20 text-left">
          <h2 className="text-3xl font-bold text-white mb-3">
            El sistema operativo para tu negocio.
          </h2>
          <p className="text-zinc-400 text-base max-w-md">
            Ventas, gastos y facturación en perfecta sincronía.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
