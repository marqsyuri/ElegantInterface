import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countries, defaultCountry, type Country } from "@/lib/countries";
import { cn } from "@/lib/utils";

interface PhoneInputWithCountryProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function PhoneInputWithCountry({
  value = "",
  onChange,
  placeholder = "Enter phone number",
  className,
  disabled = false,
}: PhoneInputWithCountryProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(defaultCountry);
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  // Parse initial value to extract country and phone
  useEffect(() => {
    if (value) {
      // Check if value already has a dial code
      const countryWithDialCode = countries.find(country => 
        value.startsWith(country.dialCode)
      );
      
      if (countryWithDialCode) {
        setSelectedCountry(countryWithDialCode);
        // Remove dial code from phone number
        const phoneWithoutDial = value.replace(countryWithDialCode.dialCode, "").trim();
        setPhoneNumber(phoneWithoutDial);
      } else {
        // If no dial code, assume it's just the phone number
        setPhoneNumber(value);
      }
    } else {
      setPhoneNumber("");
      setSelectedCountry(defaultCountry);
    }
  }, [value]);

  // Update parent when country or phone changes
  useEffect(() => {
    // Always include dial code, append phone number if it exists
    const fullNumber = phoneNumber.trim() 
      ? `${selectedCountry.dialCode}${phoneNumber.trim()}`
      : selectedCountry.dialCode;
    onChange(fullNumber);
  }, [selectedCountry, phoneNumber, onChange]);

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Remove any non-digit characters except spaces, dashes, and parentheses
    const cleaned = inputValue.replace(/[^\d\s\-()]/g, "");
    setPhoneNumber(cleaned);
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <Select
        value={selectedCountry.code}
        onValueChange={handleCountryChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedCountry.flag}</span>
              <span className="text-sm">{selectedCountry.dialCode}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {countries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{country.flag}</span>
                <span className="text-sm">{country.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {country.dialCode}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  );
}

