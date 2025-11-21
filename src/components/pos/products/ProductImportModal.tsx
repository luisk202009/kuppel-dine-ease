import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePOS } from '@/contexts/POSContext';

interface ImportRow {
  nombre: string;
  descripcion?: string;
  categoria: string;
  precio: number | string;
  costo?: number | string;
  stock?: number | string;
  stock_minimo?: number | string;
  es_alcoholico?: string | boolean;
}

interface ValidatedProduct {
  row: number;
  data: ImportRow;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  categoryId?: string;
  duplicateType?: 'file' | 'database' | null;
  existingProductId?: string;
  action?: 'create' | 'update' | 'skip';
}

interface ProductImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ProductImportModal: React.FC<ProductImportModalProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const { authState } = usePOS();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportRow[]>([]);
  const [validatedData, setValidatedData] = useState<ValidatedProduct[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [existingProducts, setExistingProducts] = useState<{ id: string; name: string }[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState({ success: 0, errors: 0, updated: 0, skipped: 0 });

  // Reset state when modal closes
  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setValidatedData([]);
    setExistingProducts([]);
    setStep('upload');
    setProgress(0);
    setImportResults({ success: 0, errors: 0, updated: 0, skipped: 0 });
    onOpenChange(false);
  };

  // Load categories and existing products when modal opens
  React.useEffect(() => {
    if (open && authState.selectedCompany?.id) {
      loadCategories();
      loadExistingProducts();
    }
  }, [open, authState.selectedCompany?.id]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('company_id', authState.selectedCompany?.id)
        .eq('is_active', true);
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadExistingProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('company_id', authState.selectedCompany?.id);
      
      if (error) throw error;
      setExistingProducts(data || []);
    } catch (error) {
      console.error('Error loading existing products:', error);
    }
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    parseFile(selectedFile);
  }, []);

  const parseFile = async (file: File) => {
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'csv') {
        parseCSV(file);
      } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
        parseExcel(file);
      } else {
        toast({
          title: "Formato no soportado",
          description: "Solo se permiten archivos CSV o Excel (.xlsx, .xls)",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error al leer archivo",
        description: "No se pudo procesar el archivo",
        variant: "destructive"
      });
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as ImportRow[];
        setParsedData(data);
        validateData(data);
      },
      error: (error) => {
        toast({
          title: "Error al leer CSV",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  };

  const parseExcel = async (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as ImportRow[];
        
        setParsedData(jsonData);
        validateData(jsonData);
      } catch (error) {
        toast({
          title: "Error al leer Excel",
          description: "No se pudo procesar el archivo Excel",
          variant: "destructive"
        });
      }
    };
    
    reader.readAsBinaryString(file);
  };

  const validateData = (data: ImportRow[]) => {
    // Detectar duplicados dentro del archivo
    const nameCount = new Map<string, number>();
    data.forEach(row => {
      if (row.nombre) {
        const normalizedName = row.nombre.toLowerCase().trim();
        nameCount.set(normalizedName, (nameCount.get(normalizedName) || 0) + 1);
      }
    });

    const validated: ValidatedProduct[] = data.map((row, index) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      let duplicateType: 'file' | 'database' | null = null;
      let existingProductId: string | undefined;
      let action: 'create' | 'update' | 'skip' = 'create';
      
      // Validar nombre (requerido)
      if (!row.nombre || row.nombre.trim() === '') {
        errors.push('Nombre es requerido');
      } else {
        const normalizedName = row.nombre.toLowerCase().trim();
        
        // Verificar duplicado dentro del archivo
        if (nameCount.get(normalizedName)! > 1) {
          duplicateType = 'file';
          warnings.push('Duplicado en el archivo - se importará solo la primera ocurrencia');
          action = 'skip';
        }
        
        // Verificar duplicado en base de datos
        const existingProduct = existingProducts.find(
          p => p.name.toLowerCase().trim() === normalizedName
        );
        
        if (existingProduct && duplicateType !== 'file') {
          duplicateType = 'database';
          existingProductId = existingProduct.id;
          warnings.push(`Producto "${existingProduct.name}" ya existe en el catálogo`);
          action = 'skip'; // Default a skip, usuario puede cambiar a update
        }
      }
      
      // Validar categoría (requerido)
      if (!row.categoria || row.categoria.trim() === '') {
        errors.push('Categoría es requerida');
      } else {
        const categoryMatch = categories.find(
          cat => cat.name.toLowerCase() === row.categoria.toLowerCase().trim()
        );
        if (!categoryMatch) {
          errors.push(`Categoría "${row.categoria}" no existe`);
        }
      }
      
      // Validar precio (requerido y > 0)
      const precio = typeof row.precio === 'string' ? parseFloat(row.precio) : row.precio;
      if (!precio || isNaN(precio) || precio <= 0) {
        errors.push('Precio debe ser mayor a 0');
      }
      
      // Validar stock (opcional, pero debe ser número válido si existe)
      if (row.stock !== undefined && row.stock !== '') {
        const stock = typeof row.stock === 'string' ? parseFloat(row.stock) : row.stock;
        if (isNaN(stock) || stock < 0) {
          errors.push('Stock debe ser un número positivo');
        }
      }
      
      // Encontrar categoryId
      const categoryId = categories.find(
        cat => cat.name.toLowerCase() === row.categoria?.toLowerCase().trim()
      )?.id;
      
      return {
        row: index + 1,
        data: row,
        isValid: errors.length === 0,
        errors,
        warnings,
        categoryId,
        duplicateType,
        existingProductId,
        action
      };
    });
    
    setValidatedData(validated);
    setStep('preview');
  };

  const handleActionChange = (rowIndex: number, newAction: 'create' | 'update' | 'skip') => {
    setValidatedData(prev => 
      prev.map((item, idx) => 
        idx === rowIndex ? { ...item, action: newAction } : item
      )
    );
  };

  const handleImport = async () => {
    setStep('importing');
    setProgress(0);
    
    let successCount = 0;
    let errorCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Filtrar productos válidos y no salteados
    const productsToProcess = validatedData.filter(p => p.isValid && p.action !== 'skip');
    
    // Agrupar por acción para evitar duplicados dentro del archivo
    const processedNames = new Set<string>();
    const finalProducts = productsToProcess.filter(p => {
      const normalizedName = p.data.nombre.toLowerCase().trim();
      if (processedNames.has(normalizedName)) {
        skippedCount++;
        return false;
      }
      processedNames.add(normalizedName);
      return true;
    });
    
    for (let i = 0; i < finalProducts.length; i++) {
      const product = finalProducts[i];
      
      try {
        const productData = {
          name: product.data.nombre.trim(),
          description: product.data.descripcion?.trim() || null,
          category_id: product.categoryId!,
          price: parseFloat(String(product.data.precio)),
          cost: product.data.costo ? parseFloat(String(product.data.costo)) : null,
          stock: product.data.stock ? parseInt(String(product.data.stock)) : 0,
          min_stock: product.data.stock_minimo ? parseInt(String(product.data.stock_minimo)) : 0,
          is_alcoholic: product.data.es_alcoholico === true || 
                       product.data.es_alcoholico === 'true' || 
                       product.data.es_alcoholico === 'sí' ||
                       product.data.es_alcoholico === 'si' ||
                       product.data.es_alcoholico === '1'
        };

        if (product.action === 'update' && product.existingProductId) {
          // Actualizar producto existente
          const { error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', product.existingProductId);
          
          if (error) throw error;
          updatedCount++;
          successCount++;
        } else if (product.action === 'create') {
          // Crear nuevo producto
          const { error } = await supabase
            .from('products')
            .insert({
              ...productData,
              company_id: authState.selectedCompany?.id,
              is_active: true
            });
          
          if (error) throw error;
          successCount++;
        }
      } catch (error) {
        console.error(`Error importing product ${product.row}:`, error);
        errorCount++;
      }
      
      setProgress(((i + 1) / finalProducts.length) * 100);
    }
    
    // Contar productos que se saltaron por acción del usuario
    const userSkipped = validatedData.filter(p => p.isValid && p.action === 'skip').length;
    skippedCount += userSkipped;
    
    setImportResults({ 
      success: successCount, 
      errors: errorCount,
      updated: updatedCount,
      skipped: skippedCount
    });
    setStep('complete');
    
    if (successCount > 0) {
      onSuccess();
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        nombre: 'Café Americano',
        descripcion: 'Café negro tradicional',
        categoria: 'Bebidas',
        precio: 5000,
        costo: 1500,
        stock: 100,
        stock_minimo: 10,
        es_alcoholico: 'no'
      },
      {
        nombre: 'Cerveza Corona',
        descripcion: 'Cerveza importada',
        categoria: 'Bebidas',
        precio: 8000,
        costo: 4000,
        stock: 50,
        stock_minimo: 5,
        es_alcoholico: 'sí'
      }
    ];
    
    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_productos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validCount = validatedData.filter(p => p.isValid).length;
  const invalidCount = validatedData.length - validCount;
  const duplicatesInFile = validatedData.filter(p => p.duplicateType === 'file').length;
  const duplicatesInDB = validatedData.filter(p => p.duplicateType === 'database').length;
  const toCreate = validatedData.filter(p => p.isValid && p.action === 'create').length;
  const toUpdate = validatedData.filter(p => p.isValid && p.action === 'update').length;
  const toSkip = validatedData.filter(p => p.isValid && p.action === 'skip').length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Importar Productos</DialogTitle>
          <DialogDescription>
            Carga masiva de productos desde archivo CSV o Excel
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6 py-6">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Selecciona un archivo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Archivos CSV o Excel (.xlsx, .xls) con los datos de tus productos
              </p>
              
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button asChild>
                  <span>
                    <FileText className="h-4 w-4 mr-2" />
                    Seleccionar Archivo
                  </span>
                </Button>
              </label>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Formato requerido:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>nombre</strong>: Nombre del producto (requerido)</li>
                <li>• <strong>descripcion</strong>: Descripción opcional</li>
                <li>• <strong>categoria</strong>: Nombre exacto de una categoría existente (requerido)</li>
                <li>• <strong>precio</strong>: Precio de venta (requerido, debe ser mayor a 0)</li>
                <li>• <strong>costo</strong>: Costo del producto (opcional)</li>
                <li>• <strong>stock</strong>: Cantidad en inventario (opcional, default 0)</li>
                <li>• <strong>stock_minimo</strong>: Stock mínimo de alerta (opcional, default 0)</li>
                <li>• <strong>es_alcoholico</strong>: sí/no (opcional, default no)</li>
              </ul>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadTemplate}
                className="mt-4"
              >
                Descargar Plantilla de Ejemplo
              </Button>
            </div>

            {categories.length === 0 && (
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-destructive">No hay categorías</p>
                  <p className="text-sm text-destructive/80">
                    Debes crear al menos una categoría antes de importar productos.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-2 flex-wrap">
                <Badge variant={validCount > 0 ? "default" : "secondary"}>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {validCount} válidos
                </Badge>
                <Badge variant={invalidCount > 0 ? "destructive" : "secondary"}>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {invalidCount} con errores
                </Badge>
                {duplicatesInFile > 0 && (
                  <Badge variant="outline" className="border-orange-500 text-orange-700">
                    {duplicatesInFile} duplicados en archivo
                  </Badge>
                )}
                {duplicatesInDB > 0 && (
                  <Badge variant="outline" className="border-blue-500 text-blue-700">
                    {duplicatesInDB} ya existen en BD
                  </Badge>
                )}
              </div>
            </div>

            {(duplicatesInDB > 0 || duplicatesInFile > 0) && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Productos duplicados detectados
                </h4>
                <p className="text-sm text-muted-foreground">
                  Se encontraron productos que ya existen. Puedes elegir qué hacer con cada uno:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Crear nuevo</strong>: Crear de todas formas (puede generar duplicados)</li>
                  <li>• <strong>Actualizar</strong>: Sobrescribir el producto existente con los nuevos datos</li>
                  <li>• <strong>Saltar</strong>: No importar este producto</li>
                </ul>
              </div>
            )}

            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Crear: {toCreate}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Actualizar: {toUpdate}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span>Saltar: {toSkip}</span>
              </div>
            </div>

            <ScrollArea className="h-[400px] rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-32">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validatedData.map((product, idx) => (
                    <TableRow key={product.row} className={!product.isValid ? 'bg-destructive/5' : ''}>
                      <TableCell className="font-medium">{product.row}</TableCell>
                      <TableCell>{product.data.nombre}</TableCell>
                      <TableCell>{product.data.categoria}</TableCell>
                      <TableCell>${parseFloat(String(product.data.precio)).toLocaleString()}</TableCell>
                      <TableCell>{product.data.stock || 0}</TableCell>
                      <TableCell>
                        {product.isValid ? (
                          <div className="space-y-1">
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              OK
                            </Badge>
                            {product.warnings.map((warning, i) => (
                              <p key={i} className="text-xs text-orange-600">{warning}</p>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Badge variant="destructive" className="gap-1">
                              <X className="h-3 w-3" />
                              Error
                            </Badge>
                            {product.errors.map((error, i) => (
                              <p key={i} className="text-xs text-destructive">{error}</p>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.isValid && product.duplicateType === 'database' ? (
                          <Select 
                            value={product.action} 
                            onValueChange={(value) => handleActionChange(idx, value as any)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="skip">Saltar</SelectItem>
                              <SelectItem value="update">Actualizar</SelectItem>
                              <SelectItem value="create">Crear nuevo</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : product.isValid && product.duplicateType === 'file' ? (
                          <Badge variant="outline" className="text-xs">
                            Auto-skip
                          </Badge>
                        ) : product.isValid ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-700 text-xs">
                            Crear
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {invalidCount > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-destructive">
                    Hay {invalidCount} fila{invalidCount !== 1 ? 's' : ''} con errores
                  </p>
                  <p className="text-sm text-destructive/80">
                    Solo se importarán los productos válidos. Corrige los errores en el archivo y vuelve a intentar para importar todos.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-6 py-8">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Importando productos...</h3>
              <p className="text-sm text-muted-foreground">
                Por favor espera mientras procesamos los datos
              </p>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-center text-sm text-muted-foreground">
              {Math.round(progress)}% completado
            </p>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Importación completada</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center border-primary/20 bg-primary/5">
                <p className="text-3xl font-bold text-primary">{importResults.success - importResults.updated}</p>
                <p className="text-sm text-muted-foreground">Creados</p>
              </Card>
              <Card className="p-4 text-center border-blue-500/20 bg-blue-500/5">
                <p className="text-3xl font-bold text-blue-700">{importResults.updated}</p>
                <p className="text-sm text-muted-foreground">Actualizados</p>
              </Card>
              <Card className="p-4 text-center border-gray-400/20 bg-gray-400/5">
                <p className="text-3xl font-bold text-gray-700">{importResults.skipped}</p>
                <p className="text-sm text-muted-foreground">Saltados</p>
              </Card>
              <Card className="p-4 text-center border-destructive/20 bg-destructive/5">
                <p className="text-3xl font-bold text-destructive">{importResults.errors}</p>
                <p className="text-sm text-muted-foreground">Errores</p>
              </Card>
            </div>

            {importResults.success > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                Los productos importados ya están disponibles en tu catálogo
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}
          
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => {
                setStep('upload');
                setFile(null);
                setParsedData([]);
                setValidatedData([]);
              }}>
                Atrás
              </Button>
              <Button 
                onClick={handleImport}
                disabled={toCreate + toUpdate === 0}
              >
                {toUpdate > 0 
                  ? `Importar ${toCreate} nuevo${toCreate !== 1 ? 's' : ''} y actualizar ${toUpdate}`
                  : `Importar ${toCreate} producto${toCreate !== 1 ? 's' : ''}`
                }
              </Button>
            </>
          )}
          
          {step === 'complete' && (
            <Button onClick={handleClose}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
