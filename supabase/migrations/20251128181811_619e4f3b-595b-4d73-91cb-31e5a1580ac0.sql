-- Add foreign key constraints to product_variants table
ALTER TABLE product_variants
ADD CONSTRAINT fk_product_variants_product
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE product_variants
ADD CONSTRAINT fk_product_variants_variant_type
FOREIGN KEY (variant_type_id) REFERENCES variant_types(id) ON DELETE RESTRICT;