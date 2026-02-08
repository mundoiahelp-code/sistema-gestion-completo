import { ChangeEvent, HTMLInputTypeAttribute, useState } from 'react';

interface Props {
  type: HTMLInputTypeAttribute;
  validation?: RegExp;
  initialValue?: string;
}

export default function useField({
  type,
  validation,
  initialValue = '',
}: Props) {
  const [value, setValue] = useState<string>(initialValue);

  type event = ChangeEvent<HTMLInputElement> | string | null;

  const onChange = (e: event) => {
    if (e === null || e === undefined) return;
    const val = typeof e === 'string' ? e : e.target?.value ?? '';

    if (val && validation && !validation.test(val)) return;

    setValue(val);
  };

  return { type, value, onChange };
}
