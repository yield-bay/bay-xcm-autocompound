import type { FC } from 'react';
import clsx from 'clsx';

interface Props {
  changed: (value: number) => void;
  isSelected: boolean;
  label: string;
  value: number;
}

const RadioButton: FC<Props> = ({ changed, isSelected, label, value }) => {
  return (
    <div
      className="flex flex-col gap-y-3 justify-start cursor-pointer"
      onClick={() => changed(value)}
    >
      <span
        className={clsx(
          'h-4 w-4 rounded-full',
          isSelected ? 'bg-primaryGreen' : 'bg-[#D9D9D9]'
        )}
      />
      <span
        className={clsx(
          'text-sm font-medium',
          isSelected && 'text-primaryGreen'
        )}
      >
        {label}
      </span>
    </div>
  );
};

export default RadioButton;
