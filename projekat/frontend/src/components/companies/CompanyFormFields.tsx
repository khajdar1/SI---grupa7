'use client';

import type { Dispatch, SetStateAction } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { clearFieldError, type FieldErrors } from '@/lib/form-validation';
import type { CompanyFormData } from '@/lib/company-validation';

interface CompanyFormFieldsProps<TFormData extends CompanyFormData> {
  formData: TFormData;
  setFormData: Dispatch<SetStateAction<TFormData>>;
  fieldErrors: FieldErrors;
  setFieldErrors: Dispatch<SetStateAction<FieldErrors>>;
  disabled?: boolean;
}

const fields: Array<{
  name: keyof CompanyFormData;
  label: string;
  type?: string;
  autoComplete?: string;
}> = [
  { name: 'name', label: 'Company name', autoComplete: 'organization' },
  { name: 'contact', label: 'Contact person', autoComplete: 'name' },
  { name: 'type', label: 'Company type' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'phone', label: 'Phone', autoComplete: 'tel' },
  { name: 'address', label: 'Address', autoComplete: 'street-address' },
  { name: 'identificationNumber', label: 'Identification number' },
];

export function CompanyFormFields<TFormData extends CompanyFormData>({
  formData,
  setFormData,
  fieldErrors,
  setFieldErrors,
  disabled = false,
}: CompanyFormFieldsProps<TFormData>) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        <div className="space-y-2" key={field.name}>
          <Label htmlFor={field.name}>{field.label}</Label>
          <Input
            id={field.name}
            type={field.type ?? 'text'}
            value={formData[field.name]}
            autoComplete={field.autoComplete}
            disabled={disabled}
            onChange={(event) => {
              setFormData((previous) => ({ ...previous, [field.name]: event.target.value }));
              setFieldErrors((previous) => clearFieldError(previous, field.name));
            }}
            aria-invalid={Boolean(fieldErrors[field.name])}
          />
          {fieldErrors[field.name] ? (
            <p className="text-xs text-destructive">{fieldErrors[field.name]}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
