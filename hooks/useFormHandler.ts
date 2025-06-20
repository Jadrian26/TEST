import { useState, useCallback, ChangeEvent, FormEvent } from 'react';

interface ValidationRules<T> {
  [key: string]: (value: any, allValues: T) => string | null;
}

interface UseFormHandlerOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void | { success: boolean, message?: string }>;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
}

interface UseFormHandlerOutput<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>; // Field-specific errors
  formError: string | null; // General form error
  isLoading: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  setValues: React.Dispatch<React.SetStateAction<T>>;
  setFieldError: (field: keyof T, error: string | null) => void;
  setFormError: (error: string | null) => void; // Setter for general form error
  clearErrors: () => void; // Will also clear formError
}

function useFormHandler<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
}: UseFormHandlerOptions<T>): UseFormHandlerOutput<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [formError, setFormErrorInternal] = useState<string | null>(null); // Internal state for general form error
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      processedValue = value === '' ? '' : parseFloat(value); 
    }
    
    setValues(prevValues => ({
      ...prevValues,
      [name]: processedValue,
    }));
    
    if (errors[name as keyof T]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: undefined,
      }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setFormErrorInternal(null); // Clear previous general form error

    if (validate) {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setIsLoading(false);
        return;
      }
    }

    try {
      const result = await onSubmit(values);
      if (typeof result === 'object' && result !== null && 'success' in result && !result.success) {
        setFormErrorInternal(result.message || 'Error en el envío.');
      }
    } catch (submitError: any) {
      setFormErrorInternal(submitError.message || 'Error en el envío.');
    } finally {
      setIsLoading(false);
    }
  }, [values, onSubmit, validate]);

  const setFieldError = useCallback((field: keyof T, error: string | null) => {
    setErrors(prevErrors => ({
      ...prevErrors,
      [field]: error ?? undefined,
    }));
  }, []);

  const setFormError = useCallback((error: string | null) => { 
    setFormErrorInternal(error);
  }, []);
  
  const clearErrors = useCallback(() => {
    setErrors({});
    setFormErrorInternal(null); 
  }, []);

  return {
    values,
    errors,
    formError, 
    isLoading,
    handleChange,
    handleSubmit,
    setValues,
    setFieldError,
    setFormError, 
    clearErrors
  };
}

export default useFormHandler;