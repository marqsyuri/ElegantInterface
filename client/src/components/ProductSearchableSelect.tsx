import * as React from "react";
import { Check, ChevronsUpDown, X, Search, DollarSign, Package, Plus, Minus, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/contexts/LocaleContext";

interface Product {
  id: number;
  name: string;
  price: string;
  currentStock: number;
  category?: string;
  unit: string;
}

export interface SelectedProduct {
  productId: number;
  quantity: number;
  price: number;        // Preço cobrado (editável)
  originalPrice: number; // Preço do catálogo (referência)
  name?: string;
  unit?: string;
  maxStock?: number;
}

interface ProductSearchableSelectProps {
  products: Product[];
  selectedProducts: SelectedProduct[];
  onSelectionChange: (selected: SelectedProduct[]) => void;
  onTotalChange?: (totalPrice: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowPriceEdit?: boolean;
}

export function ProductSearchableSelect({
  products = [],
  selectedProducts = [],
  onSelectionChange,
  onTotalChange,
  placeholder = "Buscar e selecionar produtos...",
  disabled = false,
  className = "",
  allowPriceEdit = false,
}: ProductSearchableSelectProps) {
  const { formatCurrency } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredProducts = React.useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter((prod) => {
      const nameMatch = prod.name.toLowerCase().includes(query);
      const categoryMatch = prod.category?.toLowerCase().includes(query);
      return nameMatch || categoryMatch;
    });
  }, [products, searchQuery]);

  const groupedProducts = React.useMemo(() => {
    return filteredProducts.reduce((acc, product) => {
      const category = product.category || "Outros";
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [filteredProducts]);

  const totalPrice = React.useMemo(() => {
    return selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  }, [selectedProducts]);

  const totalDiscount = React.useMemo(() => {
    return selectedProducts.reduce(
      (sum, p) => sum + ((p.originalPrice - p.price) * p.quantity),
      0
    );
  }, [selectedProducts]);

  React.useEffect(() => {
    if (onTotalChange) onTotalChange(totalPrice);
  }, [totalPrice, onTotalChange]);

  const handleAddProduct = (product: Product) => {
    const existing = selectedProducts.find(p => p.productId === product.id);
    const catalogPrice = parseFloat(product.price);
    if (existing) {
      handleUpdateQuantity(product.id, existing.quantity + 1);
    } else {
      const newProduct: SelectedProduct = {
        productId: product.id,
        quantity: 1,
        price: catalogPrice,
        originalPrice: catalogPrice,
        name: product.name,
        unit: product.unit,
        maxStock: product.currentStock,
      };
      onSelectionChange([...selectedProducts, newProduct]);
    }
    setOpen(false);
  };

  const handleRemoveProduct = (productId: number) => {
    onSelectionChange(selectedProducts.filter((p) => p.productId !== productId));
  };

  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    onSelectionChange(selectedProducts.map(p =>
      p.productId === productId ? { ...p, quantity: newQuantity } : p
    ));
  };

  const handleUpdateDiscount = (productId: number, discountValue: number) => {
    if (discountValue < 0) return;
    onSelectionChange(selectedProducts.map(p => {
      if (p.productId !== productId) return p;
      const newPrice = Math.max(0, p.originalPrice - discountValue);
      return { ...p, price: parseFloat(newPrice.toFixed(2)) };
    }));
  };

  const handleResetPrice = (productId: number) => {
    onSelectionChange(selectedProducts.map(p =>
      p.productId === productId ? { ...p, price: p.originalPrice } : p
    ));
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Input */}
      <div className="space-y-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-auto min-h-[3rem] py-2 px-3"
              disabled={disabled}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground truncate">{placeholder}</span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[500px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Buscar produtos por nome ou categoria..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList className="max-h-[400px]">
                <CommandEmpty>
                  {searchQuery ? "Nenhum produto encontrado." : "Nenhum produto disponível."}
                </CommandEmpty>
                {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                  <CommandGroup key={category} heading={category}>
                    {categoryProducts.map((product) => {
                      const isSelected = selectedProducts.some(p => p.productId === product.id);
                      const isOutOfStock = product.currentStock <= 0;
                      return (
                        <CommandItem
                          key={product.id}
                          value={product.name}
                          onSelect={() => !isOutOfStock && handleAddProduct(product)}
                          className={cn("cursor-pointer", isOutOfStock && "opacity-50 cursor-not-allowed")}
                          disabled={isOutOfStock}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <Check className={cn("h-4 w-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{product.name}</span>
                                <Badge variant={isOutOfStock ? "destructive" : "secondary"} className="text-[10px] h-5">
                                  {isOutOfStock ? "Sem estoque" : `Estoque: ${product.currentStock} ${product.unit}`}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {formatCurrency(parseFloat(product.price))}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected Products List */}
      {selectedProducts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-700">
              Produtos Adicionados ({selectedProducts.length})
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSelectionChange([])}
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
            >
              Remover todos
            </Button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {selectedProducts.map((product) => {
              const hasDiscount = product.price < product.originalPrice;
              const discountAmount = product.originalPrice - product.price;
              const discountPct = product.originalPrice > 0
                ? Math.round((discountAmount / product.originalPrice) * 100)
                : 0;

              return (
                <div
                  key={product.productId}
                  className={cn(
                    "flex items-center justify-between border rounded-lg p-3",
                    hasDiscount ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"
                  )}
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-slate-500 shrink-0" />
                      <span className="font-medium text-sm truncate">{product.name}</span>
                      {hasDiscount && (
                        <Badge className="text-[10px] h-5 bg-amber-500 hover:bg-amber-500 text-white shrink-0">
                          -{discountPct}%
                        </Badge>
                      )}
                    </div>

                    {allowPriceEdit ? (
                      <div className="mt-1.5 pl-6">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("text-xs", hasDiscount ? "text-slate-400 line-through" : "text-slate-500")}>
                            {formatCurrency(product.originalPrice)}/{product.unit}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-amber-700 font-medium">Desconto R$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={product.originalPrice}
                              value={discountAmount > 0 ? Number(discountAmount.toFixed(2)) : ''}
                              placeholder="0,00"
                              onChange={(e) =>
                                handleUpdateDiscount(product.productId, parseFloat(e.target.value) || 0)
                              }
                              className="w-16 text-xs border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 bg-white focus:border-amber-400 focus:outline-none"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          {hasDiscount && (
                            <>
                              <span className="text-xs font-medium text-slate-700">= {formatCurrency(product.price)}</span>
                              <button
                                type="button"
                                onClick={() => handleResetPrice(product.productId)}
                                className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                              >
                                Zerar
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 mt-1 pl-6">
                        {hasDiscount ? (
                          <span>
                            <span className="line-through text-slate-400 mr-1">{formatCurrency(product.originalPrice)}</span>
                            <span className="text-amber-700 font-medium">{formatCurrency(product.price)}</span>
                          </span>
                        ) : (
                          formatCurrency(product.price)
                        )} / {product.unit}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-md bg-white">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-none rounded-l-md"
                          onClick={() => handleUpdateQuantity(product.productId, product.quantity - 1)}
                          disabled={product.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{product.quantity}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-none rounded-r-md"
                          onClick={() => handleUpdateQuantity(product.productId, product.quantity + 1)}
                          disabled={product.maxStock !== undefined && product.quantity >= product.maxStock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-right w-20">
                        <span className="text-sm font-semibold">
                          {formatCurrency(product.price * product.quantity)}
                        </span>
                        {hasDiscount && (
                          <p className="text-[10px] text-amber-600">
                            -{formatCurrency(discountAmount * product.quantity)}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-red-50"
                      onClick={() => handleRemoveProduct(product.productId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Summary */}
          <div className="border-t pt-3 mt-2 space-y-1">
            {totalDiscount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-amber-700 flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  Total descontos:
                </span>
                <span className="text-amber-700 font-medium">-{formatCurrency(totalDiscount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-900">Total Produtos:</span>
              <span className="font-bold text-lg text-primary">{formatCurrency(totalPrice)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
