
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
          value={value}
          onChange={onChange}
          placeholder={placeholder || "6xxxxxxx / 2xxxxxx"}
          required={required}
          autoComplete={autoComplete || "tel-national"}
          className={`flex-1 w-full px-3 py-2 border rounded-r-md shadow-sm focus:outline-none focus:ring-2 text-sm sm:text-base transition-colors bg-brand-primary ${/* Updated to text-sm sm:text-base */
            error ? 'border-error focus:ring-error focus:border-error' : 'border-brand-quaternary focus:ring-brand-tertiary focus:border-brand-tertiary'
          }`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          pattern="[2346789]\d{6,7}" 
          title="Número de teléfono panameño válido (ej. 6xxxxxxx o 2xxxxxx)"
        />
      </div>
      {error && <p id={`${id}-error`} className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
};

export default PhoneNumberInput;