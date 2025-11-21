import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { WelcomeStep } from './WelcomeStep';
import { CategoriesStep } from './CategoriesStep';
import { ProductsStep } from './ProductsStep';
import { TablesStep } from './TablesStep';
import { CompletionStep } from './CompletionStep';
import { CompanyInfoStep } from './CompanyInfoStep';
import { useInitialSetup, SetupData } from '@/hooks/useInitialSetup';
import { usePOS } from '@/contexts/POSContext';

type Step = 'welcome' | 'company-info' | 'categories' | 'products' | 'tables' | 'completion';

export const SetupWizard: React.FC = () => {
  const { authState } = usePOS();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [companyId, setCompanyId] = useState(authState.selectedCompany?.id || '');
  const [branchId, setBranchId] = useState(authState.selectedBranch?.id || '');
  const [setupData, setSetupData] = useState<SetupData>({
    categories: [],
    products: [],
    useTables: true,
    areas: [],
    tables: [],
  });

  const { completeSetup, skipSetup, isCompleting } = useInitialSetup(
    companyId,
    branchId,
    authState.user?.id || ''
  );

  const handleStart = () => {
    setCurrentStep('company-info');
  };

  const handleCompanyInfoComplete = (newCompanyId: string, newBranchId: string, companyName: string) => {
    setCompanyId(newCompanyId);
    setBranchId(newBranchId);
    // Update local storage for persistence
    localStorage.setItem('selectedCompany', JSON.stringify({ id: newCompanyId, name: companyName }));
    localStorage.setItem('selectedBranch', JSON.stringify({ id: newBranchId, name: 'Sucursal Principal' }));
    setCurrentStep('categories');
  };

  const handleSkip = async () => {
    await skipSetup();
    window.location.reload();
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

  const handleFinish = async () => {
    const success = await completeSetup(setupData);
    if (success) {
      window.location.reload();
    }
  };

  const getStepNumber = () => {
    const steps = { welcome: 0, 'company-info': 0, categories: 1, products: 2, tables: 3, completion: 4 };
    return steps[currentStep];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-2xl">
        {/* Progress Bar */}
        {currentStep !== 'welcome' && currentStep !== 'company-info' && currentStep !== 'completion' && (
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

        {currentStep === 'company-info' && (
          <CompanyInfoStep
            onNext={handleCompanyInfoComplete}
            userId={authState.user?.id || ''}
          />
        )}

        {currentStep === 'categories' && (
          <CategoriesStep onNext={handleCategoriesComplete} />
        )}

        {currentStep === 'products' && (
          <ProductsStep
            categories={setupData.categories}
            onNext={handleProductsComplete}
            onBack={() => setCurrentStep('categories')}
          />
        )}

        {currentStep === 'tables' && (
          <TablesStep
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
