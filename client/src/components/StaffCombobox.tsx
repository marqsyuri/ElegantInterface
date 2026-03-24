import * as React from "react";
import { Check, ChevronsUpDown, User } from "lucide-react";
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

interface Staff {
  id: number;
  name: string;
  role?: string;
}

interface StaffComboboxProps {
  staff: Staff[];
  selectedStaffId?: number | null;
  onSelect: (staffId: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function StaffCombobox({
  staff = [],
  selectedStaffId,
  onSelect,
  placeholder = "Selecione um profissional...",
  disabled = false,
}: StaffComboboxProps) {
  const [open, setOpen] = React.useState(false);

  // Debug log
  React.useEffect(() => {
    if (selectedStaffId !== null && selectedStaffId !== undefined) {
    }
  }, [selectedStaffId, staff]);

  const selectedStaff = staff.find((s) => s.id === selectedStaffId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-[2.5rem] py-1.5"
          disabled={disabled}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedStaff ? (
              <>
                <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{selectedStaff.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground truncate">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar profissional..." />
          <CommandList>
            <CommandEmpty>Nenhum profissional encontrado.</CommandEmpty>
            <CommandGroup>
              {staff.length > 0 ? staff.map((staffMember) => (
                <CommandItem
                  key={staffMember.id}
                  value={staffMember.name}
                  onSelect={() => {
                    const newValue = staffMember.id === selectedStaffId ? null : staffMember.id;
                    onSelect(newValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedStaffId === staffMember.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{staffMember.name}</span>
                    {staffMember.role && (
                      <span className="text-xs text-muted-foreground">({staffMember.role})</span>
                    )}
                  </div>
                </CommandItem>
              )) : (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  Nenhum profissional disponível
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

