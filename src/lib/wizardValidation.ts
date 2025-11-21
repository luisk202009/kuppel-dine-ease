import { z } from 'zod';

// Category validation schema
export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "El nombre de la categoría no puede estar vacío" })
    .max(30, { message: "El nombre debe tener máximo 30 caracteres" })
    .refine(
      (val) => !/^\s*$/.test(val),
      { message: "El nombre no puede contener solo espacios" }
    ),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, { message: "Color inválido" }),
  icon: z
    .string()
    .min(1, { message: "Debe seleccionar un icono" }),
});

// Product validation schema
export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "El nombre del producto no puede estar vacío" })
    .max(50, { message: "El nombre debe tener máximo 50 caracteres" })
    .refine(
      (val) => !/^\s*$/.test(val),
      { message: "El nombre no puede contener solo espacios" }
    ),
  price: z
    .number({ invalid_type_error: "El precio debe ser un número" })
    .positive({ message: "El precio debe ser mayor a 0" })
    .finite({ message: "El precio debe ser un número válido" })
    .max(999999.99, { message: "El precio es demasiado alto" })
    .refine(
      (val) => Number.isFinite(val) && val > 0,
      { message: "El precio debe ser un número válido mayor a 0" }
    ),
  categoryId: z
    .string()
    .min(1, { message: "Debe seleccionar una categoría" }),
});

// Area validation schema
export const areaSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "El nombre del área no puede estar vacío" })
    .max(30, { message: "El nombre debe tener máximo 30 caracteres" })
    .refine(
      (val) => !/^\s*$/.test(val),
      { message: "El nombre no puede contener solo espacios" }
    ),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, { message: "Color inválido" }),
});

// Table validation schema
export const tableSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "El nombre de la mesa no puede estar vacío" })
    .max(20, { message: "El nombre debe tener máximo 20 caracteres" })
    .refine(
      (val) => !/^\s*$/.test(val),
      { message: "El nombre no puede contener solo espacios" }
    ),
  capacity: z
    .number({ invalid_type_error: "La capacidad debe ser un número" })
    .int({ message: "La capacidad debe ser un número entero" })
    .min(1, { message: "La capacidad debe ser al menos 1" })
    .max(20, { message: "La capacidad máxima es 20 personas" }),
  areaId: z
    .string()
    .min(1, { message: "Debe seleccionar un área" }),
});

// Setup data validation (all steps combined)
export const setupDataSchema = z.object({
  categories: z
    .array(categorySchema)
    .min(1, { message: "Debe crear al menos una categoría" })
    .refine(
      (categories) => {
        const names = categories.map(c => c.name.toLowerCase().trim());
        return names.length === new Set(names).size;
      },
      { message: "Las categorías no pueden tener nombres duplicados" }
    ),
  products: z
    .array(productSchema)
    .refine(
      (products) => {
        const names = products.map(p => p.name.toLowerCase().trim());
        return names.length === new Set(names).size;
      },
      { message: "Los productos no pueden tener nombres duplicados" }
    ),
  useTables: z.boolean(),
  areas: z
    .array(areaSchema)
    .refine(
      (areas) => {
        const names = areas.map(a => a.name.toLowerCase().trim());
        return names.length === new Set(names).size;
      },
      { message: "Las áreas no pueden tener nombres duplicados" }
    ),
  tables: z
    .array(tableSchema)
    .refine(
      (tables) => {
        const names = tables.map(t => t.name.toLowerCase().trim());
        return names.length === new Set(names).size;
      },
      { message: "Las mesas no pueden tener nombres duplicados" }
    ),
});

// Helper function to validate and return errors
export const validateSetupData = (data: unknown) => {
  const result = setupDataSchema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
    }));
    return { success: false, errors };
  }
  
  return { success: true, data: result.data };
};

// Helper to check for duplicate names in an array
export const checkDuplicateNames = (
  items: Array<{ name: string }>,
  newName: string,
  fieldName: string = 'nombre'
): { isDuplicate: boolean; message?: string } => {
  const normalizedNewName = newName.toLowerCase().trim();
  const isDuplicate = items.some(
    item => item.name.toLowerCase().trim() === normalizedNewName
  );
  
  return {
    isDuplicate,
    message: isDuplicate 
      ? `Ya existe un ${fieldName} con este nombre` 
      : undefined
  };
};

// Helper to validate single field
export const validateField = <T>(
  schema: z.ZodSchema<T>,
  value: unknown
): { success: boolean; error?: string } => {
  const result = schema.safeParse(value);
  
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors[0]?.message || 'Error de validación'
    };
  }
  
  return { success: true };
};
