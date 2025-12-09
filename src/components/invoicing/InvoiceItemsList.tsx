import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Check, X, Minus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useProducts } from '@/hooks/useProducts';
import { 
  StandardInvoiceItemFormData, 
  calculateItemTotals 
} from '@/types/invoicing';
import { cn } from '@/lib/utils';

interface InvoiceItemsListProps {
  items: StandardInvoiceItemFormData[];
  onItemsChange: (items: StandardInvoiceItemFormData[]) => void;
  isReadOnly?: boolean;
  currency?: string;
}

interface EditingItem extends StandardInvoiceItemFormData {
  isNew?: boolean;
}

const TAX_OPTIONS = [
  { value: '0', label: '0%' },
  { value: '5', label: '5%' },
  { value: '10', label: '10%' },
  { value: '19', label: '19%' },
];

export const InvoiceItemsList = ({ 
  items, 
  onItemsChange, 
  isReadOnly = false,
  currency = 'COP'
}: InvoiceItemsListProps) => {
  const { data: products = [] } = useProducts();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'USD': return '$';
      case 'EUR': return '€';
      default: return '$';
    }
  };

  const formatPrice = (value: number) => {
    return `${getCurrencySymbol(currency)}${value.toLocaleString('es-CO')}`;
  };

  const startAddItem = () => {
    setEditingIndex(items.length);
    setEditingItem({
      itemName: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 19,
      discountRate: 0,
      isNew: true,
    });
    setSearchQuery('');
  };

  const startEditItem = (index: number) => {
    setEditingIndex(index);
    setEditingItem({ ...items[index] });
    setSearchQuery(items[index].itemName);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingItem(null);
    setSearchQuery('');
    setProductSearchOpen(false);
  };

  const saveItem = () => {
    if (!editingItem || editingItem.itemName.trim() === '') return;

    const newItems = [...items];
    if (editingItem.isNew) {
      const { isNew, ...item } = editingItem;
      newItems.push(item);
    } else if (editingIndex !== null) {
      newItems[editingIndex] = editingItem;
    }
    
    onItemsChange(newItems);
    cancelEdit();
  };

  const deleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onItemsChange(newItems);
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product && editingItem) {
      setEditingItem({
        ...editingItem,
        productId,
        itemName: product.name,
        unitPrice: product.price,
      });
      setSearchQuery(product.name);
    }
    setProductSearchOpen(false);
  };

  const handleCustomItemName = (value: string) => {
    setSearchQuery(value);
    if (editingItem) {
      setEditingItem({
        ...editingItem,
        itemName: value,
        productId: undefined,
      });
    }
  };

  const updateQuantity = (delta: number) => {
    if (!editingItem) return;
    const newQty = Math.max(1, editingItem.quantity + delta);
    setEditingItem({ ...editingItem, quantity: newQty });
  };

  const getItemTotal = (item: StandardInvoiceItemFormData) => {
    const totals = calculateItemTotals(
      item.quantity,
      item.unitPrice,
      item.taxRate,
      item.discountRate
    );
    return totals.total;
  };

  const renderEditRow = (isNewRow: boolean = false) => (
    <TableRow>
      {/* Product Search Combobox */}
      <TableCell>
        <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={productSearchOpen}
              className="w-full justify-between h-9 font-normal"
            >
              <span className={cn(
                "truncate",
                !editingItem?.itemName && "text-muted-foreground"
              )}>
                {editingItem?.itemName || "Buscar producto..."}
              </span>
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder="Buscar o escribir ítem..." 
                value={searchQuery}
                onValueChange={handleCustomItemName}
              />
              <CommandList>
                <CommandEmpty>
                  {searchQuery ? (
                    <div 
                      className="cursor-pointer p-2 hover:bg-accent rounded text-sm"
                      onClick={() => {
                        if (editingItem) {
                          setEditingItem({
                            ...editingItem,
                            itemName: searchQuery,
                            productId: undefined,
                          });
                        }
                        setProductSearchOpen(false);
                      }}
                    >
                      Usar: "{searchQuery}"
                    </div>
                  ) : (
                    "No se encontraron productos"
                  )}
                </CommandEmpty>
                <CommandGroup heading="Productos">
                  {filteredProducts.slice(0, 10).map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.id}
                      onSelect={() => handleProductSelect(product.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex justify-between w-full">
                        <span>{product.name}</span>
                        <span className="text-muted-foreground text-sm">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </TableCell>

      {/* Quantity with +/- buttons */}
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => updateQuantity(-1)}
            disabled={editingItem?.quantity === 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            type="number"
            min="1"
            value={editingItem?.quantity || 1}
            onChange={(e) => setEditingItem(prev => 
              prev ? { ...prev, quantity: Math.max(1, Number(e.target.value) || 1) } : null
            )}
            className="h-8 w-14 text-center px-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => updateQuantity(1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>

      {/* Unit Price - wider */}
      <TableCell>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground text-sm">{getCurrencySymbol(currency)}</span>
          <Input
            type="number"
            min="0"
            value={editingItem?.unitPrice || 0}
            onChange={(e) => setEditingItem(prev => 
              prev ? { ...prev, unitPrice: Number(e.target.value) || 0 } : null
            )}
            className="h-8 w-[140px] text-right"
          />
        </div>
      </TableCell>

      {/* IVA Selector */}
      <TableCell>
        <Select
          value={String(editingItem?.taxRate || 19)}
          onValueChange={(val) => setEditingItem(prev => 
            prev ? { ...prev, taxRate: Number(val) } : null
          )}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TAX_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Discount */}
      <TableCell>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min="0"
            max="100"
            value={editingItem?.discountRate || 0}
            onChange={(e) => setEditingItem(prev => 
              prev ? { ...prev, discountRate: Number(e.target.value) || 0 } : null
            )}
            className="h-8 w-16 text-center"
          />
          <span className="text-muted-foreground text-sm">%</span>
        </div>
      </TableCell>

      {/* Total */}
      <TableCell className="text-right font-medium">
        {editingItem && formatPrice(getItemTotal(editingItem))}
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={saveItem}
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={cancelEdit}
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Producto / Descripción</TableHead>
              <TableHead className="w-[120px] text-center">Cantidad</TableHead>
              <TableHead className="w-[160px] text-right">Precio Unit.</TableHead>
              <TableHead className="w-[80px] text-center">IVA</TableHead>
              <TableHead className="w-[90px] text-center">Desc.</TableHead>
              <TableHead className="w-[130px] text-right">Total</TableHead>
              {!isReadOnly && <TableHead className="w-[80px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              editingIndex === index ? (
                <TableRow key={index}>
                  {renderEditRow().props.children}
                </TableRow>
              ) : (
                <TableRow key={index}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.itemName}</p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatPrice(item.unitPrice)}</TableCell>
                  <TableCell className="text-center">{item.taxRate}%</TableCell>
                  <TableCell className="text-center">{item.discountRate}%</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(getItemTotal(item))}
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => startEditItem(index)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              )
            ))}

            {/* New item row */}
            {editingIndex === items.length && editingItem?.isNew && renderEditRow(true)}

            {/* Empty state */}
            {items.length === 0 && editingIndex === null && (
              <TableRow>
                <TableCell colSpan={isReadOnly ? 6 : 7} className="text-center py-8 text-muted-foreground">
                  No hay ítems. Agrega el primer ítem a la factura.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!isReadOnly && editingIndex === null && (
        <Button variant="outline" onClick={startAddItem} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Ítem
        </Button>
      )}
    </div>
  );
};
