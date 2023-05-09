import type { FC } from 'react';
import clsx from 'clsx';
import Tooltip from './Tooltip';
import Image from 'next/image';

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
        tooltip !== ''
          ? tooltip
          : disabled && value !== 0
          ? 'Stop current task to make changes'
          : tooltip
      }
      placement="top"
    >
      <div
        className={clsx(
          'flex flex-col gap-y-2 justify-start cursor-pointer',
          className,
          disabled && 'cursor-auto select-none opacity-50'
        )}
        onClick={disabled ? () => {} : () => changed(value)}
      >
        {isSelected ? (
          <div className="-ml-1">
            <Image
              src="/icons/radio-selected.svg"
              alt="radio-selected"
              width={24}
              height={24}
            />
          </div>
        ) : (
          <div className="py-1">
            <Image src="/icons/radio.svg" alt="radio" width={16} height={16} />
          </div>
        )}
        <span className={clsx('text-base', isSelected && 'text-primaryGreen')}>
          {label}
        </span>
      </div>
    </Tooltip>
  );
};

export default RadioButton;
