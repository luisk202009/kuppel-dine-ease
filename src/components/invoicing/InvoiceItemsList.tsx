import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
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
import { useProducts } from '@/hooks/useProducts';
import { 
  StandardInvoiceItemFormData, 
  calculateItemTotals 
} from '@/types/invoicing';

interface InvoiceItemsListProps {
  items: StandardInvoiceItemFormData[];
  onItemsChange: (items: StandardInvoiceItemFormData[]) => void;
  isReadOnly?: boolean;
}

interface EditingItem extends StandardInvoiceItemFormData {
  isNew?: boolean;
}

export const InvoiceItemsList = ({ 
  items, 
  onItemsChange, 
  isReadOnly = false 
}: InvoiceItemsListProps) => {
  const { data: products = [] } = useProducts();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);

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
  };

  const startEditItem = (index: number) => {
    setEditingIndex(index);
    setEditingItem({ ...items[index] });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingItem(null);
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
    }
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

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Descripción</TableHead>
              <TableHead className="w-[80px] text-center">Cant.</TableHead>
              <TableHead className="w-[120px] text-right">Precio Unit.</TableHead>
              <TableHead className="w-[80px] text-center">IVA %</TableHead>
              <TableHead className="w-[80px] text-center">Desc. %</TableHead>
              <TableHead className="w-[120px] text-right">Total</TableHead>
              {!isReadOnly && <TableHead className="w-[80px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              editingIndex === index ? (
                <TableRow key={index}>
                  <TableCell>
                    <div className="space-y-2">
                      <Select onValueChange={handleProductSelect}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Producto (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={editingItem?.itemName || ''}
                        onChange={(e) => setEditingItem(prev => 
                          prev ? { ...prev, itemName: e.target.value } : null
                        )}
                        placeholder="Nombre del ítem"
                        className="h-8"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={editingItem?.quantity || 1}
                      onChange={(e) => setEditingItem(prev => 
                        prev ? { ...prev, quantity: Number(e.target.value) } : null
                      )}
                      className="h-8 text-center"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={editingItem?.unitPrice || 0}
                      onChange={(e) => setEditingItem(prev => 
                        prev ? { ...prev, unitPrice: Number(e.target.value) } : null
                      )}
                      className="h-8 text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={editingItem?.taxRate || 0}
                      onChange={(e) => setEditingItem(prev => 
                        prev ? { ...prev, taxRate: Number(e.target.value) } : null
                      )}
                      className="h-8 text-center"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={editingItem?.discountRate || 0}
                      onChange={(e) => setEditingItem(prev => 
                        prev ? { ...prev, discountRate: Number(e.target.value) } : null
                      )}
                      className="h-8 text-center"
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {editingItem && `$${getItemTotal(editingItem).toLocaleString()}`}
                  </TableCell>
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
                  <TableCell className="text-right">${item.unitPrice.toLocaleString()}</TableCell>
                  <TableCell className="text-center">{item.taxRate}%</TableCell>
                  <TableCell className="text-center">{item.discountRate}%</TableCell>
                  <TableCell className="text-right font-medium">
                    ${getItemTotal(item).toLocaleString()}
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
            {editingIndex === items.length && editingItem?.isNew && (
              <TableRow>
                <TableCell>
                  <div className="space-y-2">
                    <Select onValueChange={handleProductSelect}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Producto (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={editingItem?.itemName || ''}
                      onChange={(e) => setEditingItem(prev => 
                        prev ? { ...prev, itemName: e.target.value } : null
                      )}
                      placeholder="Nombre del ítem"
                      className="h-8"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    value={editingItem?.quantity || 1}
                    onChange={(e) => setEditingItem(prev => 
                      prev ? { ...prev, quantity: Number(e.target.value) } : null
                    )}
                    className="h-8 text-center"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    value={editingItem?.unitPrice || 0}
                    onChange={(e) => setEditingItem(prev => 
                      prev ? { ...prev, unitPrice: Number(e.target.value) } : null
                    )}
                    className="h-8 text-right"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editingItem?.taxRate || 0}
                    onChange={(e) => setEditingItem(prev => 
                      prev ? { ...prev, taxRate: Number(e.target.value) } : null
                    )}
                    className="h-8 text-center"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editingItem?.discountRate || 0}
                    onChange={(e) => setEditingItem(prev => 
                      prev ? { ...prev, discountRate: Number(e.target.value) } : null
                    )}
                    className="h-8 text-center"
                  />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {editingItem && `$${getItemTotal(editingItem).toLocaleString()}`}
                </TableCell>
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
            )}

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
