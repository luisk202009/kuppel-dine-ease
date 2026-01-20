import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, Zap, Mail, UserPlus, Sparkles, LayoutDashboard, FileText, ShieldCheck } from 'lucide-react';
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from '@/lib/utils';

// Brand slides data
const brandSlides = [
  {
    id: 'dashboard',
    title: 'Tu negocio, bajo control',
    description: 'Gestiona ventas, gastos y facturación desde un único panel de control inteligente.',
    illustration: 'dashboard'
  },
  {
    id: 'invoice',
    title: 'Facturación sin fricción',
    description: 'Emite facturas profesionales en segundos y automatiza tus cobros recurrentes.',
    illustration: 'invoice'
  },
  {
    id: 'security',
    title: 'Seguridad de clase mundial',
    description: 'Tus datos protegidos con los estándares más altos de encriptación y seguridad.',
    illustration: 'shield'
  }
];

// Dashboard Illustration Component
const DashboardIllustration = () => (
  <div className="relative w-72 h-52 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-5 animate-float shadow-2xl">
    {/* Mini chart bars */}
    <div className="flex items-end gap-2 mb-4 h-16">
      <div className="w-6 bg-kuppel-from/60 rounded-t-sm h-8 animate-pulse-slow" />
      <div className="w-6 bg-kuppel-from/80 rounded-t-sm h-12" />
      <div className="w-6 bg-kuppel-to/60 rounded-t-sm h-10 animate-pulse-slow" />
      <div className="w-6 bg-kuppel-to/80 rounded-t-sm h-16" />
      <div className="w-6 bg-kuppel-from rounded-t-sm h-14" />
    </div>
    {/* Stats row */}
    <div className="flex gap-3 mb-4">
      <div className="h-2 w-16 bg-kuppel-from rounded-full" />
      <div className="h-2 w-10 bg-kuppel-to rounded-full" />
    </div>
    {/* Big number */}
    <div className="text-4xl font-mono font-bold text-white tracking-tight">
      $12,450
    </div>
    <div className="text-xs text-zinc-400 mt-1 font-medium">Ventas del mes</div>
  </div>
);

// Invoice Illustration Component
const InvoiceIllustration = () => (
  <div className="relative animate-float">
    {/* Glow effect */}
    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-kuppel-from/30 to-kuppel-to/30 blur-2xl scale-150" />
    {/* Main circle */}
    <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-kuppel-from to-kuppel-to flex items-center justify-center shadow-2xl">
      <FileText className="h-16 w-16 text-white animate-pulse-slow" />
    </div>
  </div>
);

// Shield Illustration Component
const ShieldIllustration = () => (
  <div className="relative animate-float">
    {/* Glow effect */}
    <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl scale-150" />
    {/* Main circle */}
    <div className="relative w-36 h-36 rounded-full bg-white/5 border-2 border-emerald-500/40 flex items-center justify-center shadow-2xl backdrop-blur-sm">
      <ShieldCheck className="h-16 w-16 text-emerald-400 animate-pulse-slow" />
    </div>
  </div>
);

// Slide Illustration Selector
const SlideIllustration = ({ type }: { type: string }) => {
  switch (type) {
    case 'dashboard':
      return <DashboardIllustration />;
    case 'invoice':
      return <InvoiceIllustration />;
    case 'shield':
      return <ShieldIllustration />;
    default:
      return <DashboardIllustration />;
  }
};

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
  
  // Carousel state
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  const {
    authState,
    login,
    selectCompanyAndBranch
  } = usePOS();
  const signUpMutation = useSignUp();
  const resetPasswordMutation = useResetPassword();
  const magicLinkMutation = useMagicLink();
  const { toast } = useToast();

  // Carousel autoplay
  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };

    carouselApi.on('select', onSelect);

    const interval = setInterval(() => {
      if (carouselApi.canScrollNext()) {
        carouselApi.scrollNext();
      } else {
        carouselApi.scrollTo(0);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

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

      {/* Right Panel - Brand Showcase (Desktop Only) */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-zinc-900 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(192,216,96,0.15),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(74,183,198,0.10),_transparent_50%)]" />
        
        {/* Noise texture */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />

        {/* Carousel */}
        <div className="relative z-10 w-full max-w-lg px-8">
          <Carousel setApi={setCarouselApi} opts={{ loop: true }}>
            <CarouselContent>
              {brandSlides.map((slide) => (
                <CarouselItem key={slide.id}>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    {/* Illustration */}
                    <div className="relative mb-10 h-56 flex items-center justify-center">
                      <SlideIllustration type={slide.illustration} />
                    </div>
                    
                    {/* Text */}
                    <h2 className="text-2xl font-bold text-white mb-3">
                      {slide.title}
                    </h2>
                    <p className="text-zinc-400 text-sm max-w-sm leading-relaxed">
                      {slide.description}
                    </p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {brandSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => carouselApi?.scrollTo(index)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  currentSlide === index 
                    ? "w-6 bg-white" 
                    : "w-2 bg-white/30 hover:bg-white/50"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
