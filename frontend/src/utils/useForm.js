import { useState } from 'react';
import { validate } from './validation';

/** Small form helper: values, per-field errors (client + server), touched-on-blur validation. */
export default function useForm(initial, schema) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});

  const onChange = (e) => {
    const { name, type, checked, value } = e.target;
    const next = { ...values, [name]: type === 'checkbox' ? checked : value };
    setValues(next);
    if (errors[name]) {
      const msg = schema[name]?.(next[name], next);
      setErrors((prev) => ({ ...prev, [name]: msg || undefined }));
    }
  };

  const onBlur = (e) => {
    const { name } = e.target;
    const msg = schema[name]?.(values[name], values);
    setErrors((prev) => ({ ...prev, [name]: msg || undefined }));
  };

  /** Validates everything; returns true when the form can be submitted. */
  const validateAll = () => {
    const errs = validate(values, schema);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  return { values, setValues, errors, setErrors, onChange, onBlur, validateAll };
}
