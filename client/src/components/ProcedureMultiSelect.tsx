import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, X, Clock, DollarSign } from "lucide-react";

interface Procedure {
  id: number;
  name: string;
  price: string;
  duration: number;
  category?: string;
}

interface ProcedureMultiSelectProps {
  procedures: Procedure[];
  selectedProcedureIds: number[];
  onSelectionChange: (selectedIds: number[]) => void;
  onTotalChange?: (totalPrice: number, totalDuration: number) => void;
  showSummary?: boolean;
  className?: string;
}

export function ProcedureMultiSelect({
  procedures,
  selectedProcedureIds,
  onSelectionChange,
  onTotalChange,
  showSummary = true,
  className = "",
}: ProcedureMultiSelectProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Group procedures by category
  const groupedProcedures = procedures.reduce((acc, procedure) => {
    const category = procedure.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(procedure);
    return acc;
  }, {} as Record<string, Procedure[]>);

  // Expand all categories by default
  useEffect(() => {
    const allCategories = Object.keys(groupedProcedures);
    setExpandedCategories(new Set(allCategories));
  }, [procedures]);

  // Calculate totals
  const selectedProcedures = procedures.filter(p => selectedProcedureIds.includes(p.id));
  const totalPrice = selectedProcedures.reduce((sum, p) => sum + parseFloat(p.price || '0'), 0);
  const totalDuration = selectedProcedures.reduce((sum, p) => sum + (p.duration || 0), 0);

  // Notify parent when totals change
  useEffect(() => {
    if (onTotalChange) {
      onTotalChange(totalPrice, totalDuration);
    }
  }, [totalPrice, totalDuration, onTotalChange]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleProcedureToggle = (procedureId: number) => {
    const newSelected = selectedProcedureIds.includes(procedureId)
      ? selectedProcedureIds.filter(id => id !== procedureId)
      : [...selectedProcedureIds, procedureId];
    onSelectionChange(newSelected);
  };

  const handleRemoveProcedure = (procedureId: number) => {
    onSelectionChange(selectedProcedureIds.filter(id => id !== procedureId));
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Procedure Selection */}
      <div className="space-y-3">
        {Object.entries(groupedProcedures).map(([category, categoryProcedures]) => (
          <div key={category} className="border border-slate-200 rounded-lg overflow-hidden">
            {/* Category Header */}
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900">{category}</span>
                <Badge variant="secondary" className="text-xs">
                  {categoryProcedures.length}
                </Badge>
              </div>
              {expandedCategories.has(category) ? (
                <ChevronUp className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              )}
            </button>

            {/* Category Procedures */}
            {expandedCategories.has(category) && (
              <div className="divide-y divide-slate-100">
                {categoryProcedures.map((procedure) => (
                  <label
                    key={procedure.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedProcedureIds.includes(procedure.id)}
                      onCheckedChange={() => handleProcedureToggle(procedure.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900">{procedure.name}</div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {parseFloat(procedure.price || '0').toFixed(2)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(procedure.duration || 60)}
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Panel */}
      {showSummary && selectedProcedures.length > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-slate-900 flex items-center gap-2">
                Selected Procedures
                <Badge variant="secondary">{selectedProcedures.length}</Badge>
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-8 text-xs text-slate-600 hover:text-slate-900"
              >
                Clear All
              </Button>
            </div>

            {/* Selected Items List */}
            <div className="space-y-2 mb-3">
              {selectedProcedures.map((procedure) => (
                <div
                  key={procedure.id}
                  className="flex items-center justify-between gap-2 p-2 bg-white rounded-md"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {procedure.name}
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <span>${parseFloat(procedure.price || '0').toFixed(2)}</span>
                      <span>•</span>
                      <span>{formatDuration(procedure.duration || 60)}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveProcedure(procedure.id)}
                    className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-3 border-t border-green-200 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Total Duration:</span>
                <span className="font-medium text-slate-900">{formatDuration(totalDuration)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-900 font-medium">Total Price:</span>
                <span className="text-lg font-bold text-green-700">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
