import React, { ChangeEvent } from 'react';

interface PhoneNumberInputProps {
  id: string;
  label: string;
  value: string; 
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  wrapperClassName?: string;
  autoComplete?: string;
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
  wrapperClassName,
  autoComplete
}) => {

  const formatPhoneNumber = (inputValue: string): string => {
    const digits = inputValue.replace(/\D/g, '');
    
    if (digits.length === 0) return '';

    if (digits.startsWith('6') && digits.length <= 8) { // Typically 8-digit mobile numbers starting with 6
      if (digits.length > 4) {
        return `${digits.slice(0, 4)}-${digits.slice(4)}`;
      }
      return digits;
    } else if (digits.length <= 7) { // Typically 7-digit landlines
      if (digits.length > 3) {
        return `${digits.slice(0, 3)}-${digits.slice(3)}`;
      }
      return digits;
    }
    // If it's longer than typical, just return the digits or apply a generic rule if needed
    return digits.slice(0, digits.startsWith('6') ? 8 : 7); 
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    // Create a new event object with the formatted value to pass to the original onChange
    const newEvent = {
      ...e,
      target: {
        ...e.target,
        value: formattedValue,
      },
    };
    onChange(newEvent as ChangeEvent<HTMLInputElement>);
  };


  return (
    <div className={`mb-4 ${wrapperClassName || ''}`}>
      <label htmlFor={id} className="block text-sm sm:text-base font-medium text-text-primary mb-1"> {/* Updated to text-sm sm:text-base */}
        {label} {required && <span className="text-error">*</span>}
      </label>
      <div className="flex items-center">
        <span className={`px-3 py-2 border border-r-0 rounded-l-md bg-brand-primary text-text-secondary text-sm sm:text-base ${/* Updated to text-sm sm:text-base */
            error ? 'border-error' : 'border-brand-quaternary'
        }`}>
          +507
        </span>
        <input
          type="tel"
          id={id}
          name={id}
          value={value} // The value prop is now expected to be pre-formatted or will be formatted on change
          onChange={handleInputChange} // Use the new handler
          placeholder={placeholder || "Ej: 6XXX-XXXX o 2XX-XXXX"}
          required={required}
          autoComplete={autoComplete || "tel-national"}
          className={`flex-1 w-full px-3 py-2 border rounded-r-md shadow-sm focus:outline-none focus:ring-2 text-sm sm:text-base transition-colors bg-brand-primary ${/* Updated to text-sm sm:text-base */
            error ? 'border-error focus:ring-error focus:border-error' : 'border-brand-quaternary focus:ring-brand-tertiary focus:border-brand-tertiary'
          }`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          pattern="^([234789]\d{2}-\d{4}|6\d{3}-\d{4})$" 
          title="Número de teléfono panameño válido (Ej: 6XXX-XXXX o 2XX-XXXX)"
          maxLength={9} // Max length for 6XXX-XXXX (8 digits + 1 hyphen)
        />
      </div>
      {error && <p id={`${id}-error`} className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
};

export default PhoneNumberInput;
