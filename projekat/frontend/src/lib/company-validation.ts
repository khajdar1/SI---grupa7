import {
  validateEmail,
  validateSafeText,
  translateValidationMessage,
  type FieldErrors,
} from './form-validation';

const PHONE_REGEX = /^[+0-9() .-]{6,30}$/;

export interface CompanyFormData {
  name: string;
  contact: string;
  type: string;
  email: string;
  phone: string;
  address: string;
  identificationNumber: string;
}

export const EMPTY_COMPANY_FORM: CompanyFormData = {
  name: '',
  contact: '',
  type: '',
  email: '',
  phone: '',
  address: '',
  identificationNumber: '',
};

export function validateCompanyForm(data: CompanyFormData): FieldErrors {
  const errors: FieldErrors = {};

  const nameError = validateSafeText(data.name, {
    requiredMessage: 'Company name is required.',
    minLength: 2,
    maxLength: 150,
  });
  if (nameError) errors.name = nameError;

  const contactError = validateSafeText(data.contact, { maxLength: 150 });
  if (contactError) errors.contact = contactError;

  const typeError = validateSafeText(data.type, { maxLength: 100 });
  if (typeError) errors.type = typeError;

  if (data.email.trim()) {
    const emailError = validateEmail(data.email, 'Email is required.', 'Enter a valid email address.');
    if (emailError) errors.email = emailError;
  }

  const phone = data.phone.trim();
  if (phone && !PHONE_REGEX.test(phone)) {
    errors.phone = translateValidationMessage('Phone number format is invalid.');
  }

  const addressError = validateSafeText(data.address, { maxLength: 200 });
  if (addressError) errors.address = addressError;

  const identificationError = validateSafeText(data.identificationNumber, { maxLength: 80 });
  if (identificationError) errors.identificationNumber = identificationError;

  return errors;
}

export function toCompanyInput(data: CompanyFormData) {
  return {
    name: data.name.trim(),
    contact: data.contact.trim() || null,
    type: data.type.trim() || null,
    email: data.email.trim() || null,
    phone: data.phone.trim() || null,
    address: data.address.trim() || null,
    identificationNumber: data.identificationNumber.trim() || null,
  };
}
