import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/ui/logo';
import { Company, Branch } from '@/types/api';

interface CompanySelectionProps {
  companies: Company[];
  branches: Branch[];
  onSelect: (company: Company, branch: Branch) => void;
}

export const CompanySelection: React.FC<CompanySelectionProps> = ({
  companies,
  branches,
  onSelect,
}) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const availableBranches = branches.filter(b => b.companyId === selectedCompanyId);

  const handleContinue = () => {
    const company = companies.find(c => c.id === selectedCompanyId);
    const branch = branches.find(b => b.id === selectedBranchId);
    
    if (company && branch) {
      onSelect(company, branch);
    }
  };

  const canContinue = selectedCompanyId && selectedBranchId;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo className="h-8" />
          </div>
          <CardTitle className="text-2xl">Seleccionar ubicación</CardTitle>
          <CardDescription>
            Elige la empresa y sucursal donde trabajarás
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Empresa</label>
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCompanyId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Sucursal</label>
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {availableBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedCompany && (
            <div className="p-3 bg-muted rounded-md text-sm">
              <p className="font-medium">{selectedCompany.name}</p>
              <p className="text-muted-foreground">{selectedCompany.address}</p>
              <p className="text-muted-foreground">{selectedCompany.phone}</p>
            </div>
          )}

          <Button 
            onClick={handleContinue}
            disabled={!canContinue}
            className="w-full"
          >
            Continuar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};