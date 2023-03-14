import type { FC } from 'react';
import clsx from 'clsx';

interface Props {
  changed: (value: number) => void;
  isSelected: boolean;
  label: string;
  value: number;
  className?: string;
}

const RadioButton: FC<Props> = ({
  changed,
  isSelected,
  label,
  value,
  className,
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col gap-y-3 justify-start cursor-pointer',
        className
      )}
      onClick={() => changed(value)}
    >
      <span
        className={clsx(
          'h-4 w-4 rounded-full',
          isSelected ? 'bg-primaryGreen' : 'bg-[#D9D9D9]'
        )}
      />
      <span className={clsx('text-base', isSelected && 'text-primaryGreen')}>
        {label}
      </span>
    </div>
  );
};

export default RadioButton;
