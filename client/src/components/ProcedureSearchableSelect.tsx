import * as React from "react";
import { Check, ChevronsUpDown, X, Search, Clock, DollarSign, Sparkles } from "lucide-react";
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

interface Procedure {
  id: number;
  name: string;
  price: string;
  duration: number;
  category?: string;
}

interface ProcedureSearchableSelectProps {
  procedures: Procedure[];
  selectedProcedureIds: number[];
  onSelectionChange: (selectedIds: number[]) => void;
  onTotalChange?: (totalPrice: number, totalDuration: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ProcedureSearchableSelect({
  procedures = [],
  selectedProcedureIds = [],
  onSelectionChange,
  onTotalChange,
  placeholder = "Buscar e selecionar procedimentos...",
  disabled = false,
  className = "",
}: ProcedureSearchableSelectProps) {
  const { formatCurrency } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter procedures based on search query
  const filteredProcedures = React.useMemo(() => {
    if (!searchQuery.trim()) return procedures;
    
    const query = searchQuery.toLowerCase();
    return procedures.filter((proc) => {
      const nameMatch = proc.name.toLowerCase().includes(query);
      const categoryMatch = proc.category?.toLowerCase().includes(query);
      return nameMatch || categoryMatch;
    });
  }, [procedures, searchQuery]);

  // Group filtered procedures by category
  const groupedProcedures = React.useMemo(() => {
    return filteredProcedures.reduce((acc, procedure) => {
      const category = procedure.category || "Outros";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(procedure);
      return acc;
    }, {} as Record<string, Procedure[]>);
  }, [filteredProcedures]);

  // Get selected procedures
  const selectedProcedures = procedures.filter((p) =>
    selectedProcedureIds.includes(p.id)
  );

  // Calculate totals
  const totalPrice = selectedProcedures.reduce(
    (sum, p) => sum + parseFloat(p.price || "0"),
    0
  );
  const totalDuration = selectedProcedures.reduce(
    (sum, p) => sum + (p.duration || 0),
    0
  );

  // Notify parent when totals change
  React.useEffect(() => {
    if (onTotalChange) {
      onTotalChange(totalPrice, totalDuration);
    }
  }, [totalPrice, totalDuration, onTotalChange]);

  const handleToggleProcedure = (procedureId: number) => {
    const isSelected = selectedProcedureIds.includes(procedureId);
    const newSelected = isSelected
      ? selectedProcedureIds.filter((id) => id !== procedureId)
      : [...selectedProcedureIds, procedureId];
    onSelectionChange(newSelected);
  };

  const handleRemoveProcedure = (procedureId: number) => {
    onSelectionChange(selectedProcedureIds.filter((id) => id !== procedureId));
  };

  const formatDuration = React.useCallback((minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }, []);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search Input and Selected Count */}
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
                <span className="text-muted-foreground truncate">
                  {selectedProcedureIds.length > 0
                    ? `${selectedProcedureIds.length} procedimento(s) selecionado(s)`
                    : placeholder}
                </span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[500px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Buscar procedimentos por nome ou categoria..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList className="max-h-[400px]">
                <CommandEmpty>
                  {searchQuery
                    ? "Nenhum procedimento encontrado."
                    : "Nenhum procedimento disponível."}
                </CommandEmpty>
                {Object.entries(groupedProcedures).map(([category, categoryProcedures]) => (
                  <CommandGroup key={category} heading={category}>
                    {categoryProcedures.map((procedure) => {
                      const isSelected = selectedProcedureIds.includes(procedure.id);
                      return (
                        <CommandItem
                          key={procedure.id}
                          value={procedure.name}
                          onSelect={() => handleToggleProcedure(procedure.id)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-3 w-full">
                            <Check
                              className={cn(
                                "h-4 w-4 shrink-0",
                                isSelected ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{procedure.name}</div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {formatCurrency(parseFloat(procedure.price || "0"))}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(procedure.duration || 60)}
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <Badge variant="secondary" className="shrink-0">
                                Selecionado
                              </Badge>
                            )}
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

      {/* Selected Procedures Display */}
      {selectedProcedures.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">
              Procedimentos Selecionados ({selectedProcedures.length})
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSelectionChange([])}
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
            >
              Limpar todos
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedProcedures.map((procedure) => (
              <Badge
                key={procedure.id}
                variant="secondary"
                className="px-3 py-1.5 pr-1.5 flex items-center gap-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              >
                <Sparkles className="h-3 w-3" />
                <span className="font-medium">{procedure.name}</span>
                <span className="text-xs text-blue-600">
                  {formatCurrency(parseFloat(procedure.price || "0"))}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveProcedure(procedure.id)}
                  className="ml-1 rounded-full hover:bg-blue-200 p-0.5 transition-colors"
                  aria-label={`Remover ${procedure.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Summary Card */}
      {selectedProcedures.length > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50/50 p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-green-900">Total:</span>
            <span className="font-semibold text-green-900">
              {formatCurrency(totalPrice)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-700">Duração Total:</span>
            <span className="font-medium text-green-800">
              {formatDuration(totalDuration)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

