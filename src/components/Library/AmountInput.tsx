import type { FC } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const AmountInput: FC<Props> = ({ value, onChange }) => {
  return (
    <input
      placeholder="0"
      className="text-xl leading-[27px] bg-transparent text-right focus:outline-none"
      min={0}
      onChange={(e) => onChange(e.target.value)}
      value={value}
    />
  );
};

export default AmountInput;
