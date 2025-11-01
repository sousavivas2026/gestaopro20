-- Add cost_items column to products table to store detailed cost breakdown
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS cost_items jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.products.cost_items IS 'Detailed cost items with description and cost values';

-- Create index for better performance on jsonb queries
CREATE INDEX IF NOT EXISTS idx_products_cost_items ON public.products USING gin(cost_items);