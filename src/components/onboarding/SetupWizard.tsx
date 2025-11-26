import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { WelcomeStep } from './WelcomeStep';
import { PlanSelectionStep } from './PlanSelectionStep';
import { BusinessTypeStep } from './BusinessTypeStep';
import { CategoriesStep } from './CategoriesStepEditable';
import { ProductsStep } from './ProductsStepEditable';
import { TablesStep } from './TablesStepWithToggle';
import { CompletionStep } from './CompletionStep';
import { CompanyInfoStep } from './CompanyInfoStep';
import { useInitialSetup, SetupData } from '@/hooks/useInitialSetup';
import { usePOS } from '@/contexts/POSContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type Step = 'welcome' | 'plan-selection' | 'company-info' | 'business-type' | 'categories' | 'products' | 'tables' | 'completion';

export const SetupWizard: React.FC = () => {
  const { authState } = usePOS();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  // ✅ NO usar '' como fallback - si no hay ID, es undefined
  const [companyId, setCompanyId] = useState(authState.selectedCompany?.id);
  const [branchId, setBranchId] = useState(authState.selectedBranch?.id);
  const [companyName, setCompanyName] = useState('');
  const [setupData, setSetupData] = useState<SetupData>({
    categories: [],
    products: [],
    useTables: true,
    areas: [],
    tables: [],
  });

  // Solo necesitamos seedData y skipSetup del hook
  const { seedData, skipSetup, isSeeding } = useInitialSetup(
    companyId || '',
    branchId || '',
    authState.user?.id || ''
  );
  const [isCompleting, setIsCompleting] = useState(false);

  const handleStart = () => {
    setCurrentStep('plan-selection');
  };

  const handlePlanSelected = (planId: string) => {
    setSelectedPlanId(planId);
    setCurrentStep('company-info');
  };

  const handleCompanyInfoComplete = (newCompanyId: string, newBranchId: string, name: string) => {
    // Validar que los IDs sean UUIDs válidos antes de continuar
    if (!newCompanyId || !newBranchId) {
      console.error('Company or branch ID is missing');
      return;
    }

    console.log('Company and branch created successfully:', { companyId: newCompanyId, branchId: newBranchId });
    
    setCompanyId(newCompanyId);
    setBranchId(newBranchId);
    setCompanyName(name);
    setCurrentStep('business-type');
  };

  const handleBusinessTypeComplete = async (businessType: string) => {
    // Generar seed según tipo de negocio
    const success = await seedData(businessType);
    if (success) {
      setCurrentStep('categories');
    }
  };

  const handleSkip = async () => {
    const success = await skipSetup();
    if (success) {
      window.location.reload();
    }
    // Si falla, el toast ya se mostró en skipSetup
  };

  const handleCategoriesComplete = (categories: SetupData['categories']) => {
    setSetupData((prev) => ({ ...prev, categories }));
    setCurrentStep('products');
  };

  const handleProductsComplete = (products: SetupData['products']) => {
    setSetupData((prev) => ({ ...prev, products }));
    setCurrentStep('tables');
  };

  const handleTablesComplete = (data: { useTables: boolean; areas: SetupData['areas']; tables: SetupData['tables'] }) => {
    setSetupData((prev) => ({ ...prev, ...data }));
    setCurrentStep('completion');
  };

  /**
   * handleFinish - Marca el setup como completado y navega al dashboard
   * 
   * IMPORTANTE: No valida ni inserta datos aquí porque:
   * - Los datos ya fueron insertados por seedData() en el paso de business-type
   * - Los pasos intermedios solo cargan y muestran los datos existentes
   * - Solo necesitamos marcar setup_completed = true para el usuario
   */
  const handleFinish = async () => {
    console.log('🎯 CompletionStep: Iniciando handleFinish (nueva versión sin validación)');
    
    if (!authState.user?.id) {
      console.error('Cannot complete setup: missing user ID');
      return;
    }

    setIsCompleting(true);

    try {
      console.log('📝 Actualizando setup_completed para user:', authState.user.id);
      
      const { error } = await supabase
        .from('users')
        .update({ setup_completed: true })
        .eq('id', authState.user.id);

      if (error) throw error;

      console.log('✅ Setup marcado como completado exitosamente');
      
      // Recargar para que el sistema detecte que el setup está completado
      window.location.reload();
    } catch (error) {
      console.error('❌ Error marcando setup como completado:', error);
      toast({
        title: 'Error',
        description: 'No pudimos completar la configuración. Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const getStepNumber = () => {
    const steps = { 
      welcome: 0, 
      'plan-selection': 0,
      'company-info': 0, 
      'business-type': 0,
      categories: 1, 
      products: 2, 
      tables: 3, 
      completion: 4 
    };
    return steps[currentStep];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-2xl">
        {/* Progress Bar */}
        {currentStep !== 'welcome' && currentStep !== 'plan-selection' && currentStep !== 'company-info' && currentStep !== 'business-type' && currentStep !== 'completion' && (
          <div className="px-8 pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Paso {getStepNumber()} de 3
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round((getStepNumber() / 3) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(getStepNumber() / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 'welcome' && (
          <WelcomeStep onStart={handleStart} onSkip={handleSkip} />
        )}

        {currentStep === 'plan-selection' && (
          <PlanSelectionStep
            onNext={handlePlanSelected}
            onBack={() => setCurrentStep('welcome')}
          />
        )}

        {currentStep === 'company-info' && (
          <CompanyInfoStep
            onNext={handleCompanyInfoComplete}
            userId={authState.user?.id || ''}
            planId={selectedPlanId}
          />
        )}

        {currentStep === 'business-type' && (
          <BusinessTypeStep
            onNext={handleBusinessTypeComplete}
            companyName={companyName}
          />
        )}

        {currentStep === 'categories' && companyId && branchId && (
          <CategoriesStep 
            companyId={companyId}
            onNext={handleCategoriesComplete} 
          />
        )}

        {currentStep === 'products' && companyId && (
          <ProductsStep
            companyId={companyId}
            categories={setupData.categories}
            onNext={handleProductsComplete}
            onBack={() => setCurrentStep('categories')}
          />
        )}

        {currentStep === 'tables' && branchId && (
          <TablesStep
            branchId={branchId}
            onNext={handleTablesComplete}
            onBack={() => setCurrentStep('products')}
          />
        )}

        {currentStep === 'completion' && (
          <CompletionStep
            setupData={setupData}
            onFinish={handleFinish}
            isLoading={isCompleting}
          />
        )}
      </Card>
    </div>
  );
};
