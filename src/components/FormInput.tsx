import React, { useState, useEffect } from 'react';
import './FormInput.css';

interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
}

interface FormInputProps {
  id: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number';
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  validationRules?: ValidationRule[];
  showValidation?: boolean;
  helpText?: string;
  maxLength?: number;
  minLength?: number;
  className?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  id,
  name,
  type = 'text',
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  autoComplete,
  validationRules = [],
  showValidation = true,
  helpText,
  maxLength,
  minLength,
  className = '',
}) => {
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (!showValidation || !touched) return;

    // Required check
    if (required && !value.trim()) {
      setError(`${label} is required`);
      setIsValid(false);
      return;
    }

    // Min length check
    if (minLength && value.length < minLength) {
      setError(`${label} must be at least ${minLength} characters`);
      setIsValid(false);
      return;
    }

    // Max length check
    if (maxLength && value.length > maxLength) {
      setError(`${label} must be no more than ${maxLength} characters`);
      setIsValid(false);
      return;
    }

    // Custom validation rules
    for (const rule of validationRules) {
      if (!rule.test(value)) {
        setError(rule.message);
        setIsValid(false);
        return;
      }
    }

    setError(null);
    setIsValid(value.length > 0);
  }, [value, touched, required, validationRules, label, showValidation, minLength, maxLength]);

  const handleBlur = () => {
    setTouched(true);
  };

  return (
    <div className={`form-input-wrapper ${className}`}>
      <label htmlFor={id} className="form-input-label">
        {label}
        {required && <span className="form-input-required" aria-hidden="true">*</span>}
      </label>
      <div className="form-input-container">
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          minLength={minLength}
          className={`form-input ${touched && error ? 'form-input-error' : ''} ${touched && isValid ? 'form-input-valid' : ''}`}
          aria-invalid={touched && error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
        />
        {touched && isValid && (
          <span className="form-input-icon form-input-icon-valid" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
        )}
        {touched && error && (
          <span className="form-input-icon form-input-icon-error" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </span>
        )}
      </div>
      {touched && error && (
        <p id={`${id}-error`} className="form-input-error-text" role="alert">
          {error}
        </p>
      )}
      {helpText && !error && (
        <p id={`${id}-help`} className="form-input-help">
          {helpText}
        </p>
      )}
      {maxLength && (
        <p className="form-input-count">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
};

// Common validation rules
export const emailValidation: ValidationRule = {
  test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  message: 'Please enter a valid email address',
};

export const passwordValidation: ValidationRule = {
  test: (value) => value.length >= 8,
  message: 'Password must be at least 8 characters',
};

export const strongPasswordValidation: ValidationRule = {
  test: (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value),
  message: 'Password must contain uppercase, lowercase, number, and special character',
};

// Password Strength Indicator
interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const getStrength = (): { level: number; label: string; color: string } => {
    if (!password) return { level: 0, label: '', color: '' };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: 'var(--color-error)' };
    if (score <= 2) return { level: 2, label: 'Fair', color: 'var(--color-warning)' };
    if (score <= 3) return { level: 3, label: 'Good', color: 'var(--color-info)' };
    return { level: 4, label: 'Strong', color: 'var(--color-success)' };
  };

  const { level, label, color } = getStrength();

  if (!password) return null;

  return (
    <div className="password-strength">
      <div className="password-strength-bars">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`password-strength-bar ${i <= level ? 'active' : ''}`}
            style={{ backgroundColor: i <= level ? color : undefined }}
          />
        ))}
      </div>
      <span className="password-strength-label" style={{ color }}>
        {label}
      </span>
    </div>
  );
};

export default FormInput;
