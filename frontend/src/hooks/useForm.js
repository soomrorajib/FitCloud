import { useState } from 'react';

// Form ki values aur errors sambhalta hai
export default function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const setField = (name, value) => {
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => (previous[name] ? { ...previous, [name]: undefined } : previous));
  };

  const handleChange = (event) => setField(event.target.name, event.target.value);
  const reset = (nextValues = initialValues) => { setValues(nextValues); setErrors({}); };

  return { values, errors, setErrors, setField, handleChange, reset };
}
