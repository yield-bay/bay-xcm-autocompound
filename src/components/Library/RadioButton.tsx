import type { FC } from 'react';
import clsx from 'clsx';
import Tooltip from './Tooltip';

interface Props {
  changed: (value: number) => void;
  isSelected: boolean;
  label: string;
  value: number;
  disabled?: boolean;
  tooltip?: string;
  className?: string;
}

/**
 * A Custom ratio-button Component that can be used to select a value from a list of options
 * @param changed - The function to be called when the button is clicked
 * @param isSelected - Whether the button is selected or not
 * @param label - The text to be displayed in the button
 * @param value - The value of the button
 * @param disabled - button is disabled or not
 * @param tooltip - The text to be displayed in the tooltip
 * @param className - Extra styling to the button
 */
const RadioButton: FC<Props> = ({
  changed,
  isSelected,
  label,
  value,
  className,
  disabled,
  tooltip = '',
}) => {
  return (
    <Tooltip
      label={
        disabled && value !== 0 ? 'Stop current task to make changes' : tooltip
      }
      placement="top"
    >
      <div
        className={clsx(
          'flex flex-col gap-y-3 justify-start cursor-pointer',
          className,
          disabled && 'cursor-auto select-none opacity-50'
        )}
        onClick={disabled ? () => {} : () => changed(value)}
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
    </Tooltip>
  );
};

export default RadioButton;
