import type { FC } from 'react';
import clsx from 'clsx';

interface ButtonProps {
  type: 'primary' | 'secondary' | 'warning' | 'transparent';
  text: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const Button: FC<ButtonProps> = ({
  type,
  text,
  onClick,
  disabled,
  className,
}) => {
  return (
    <button
      disabled={disabled}
      className={clsx(
        'text-center text-base leading-[21.6px] py-[13px] transition duration-100 ease-in-out rounded-lg',
        type === 'primary' && 'bg-white hover:bg-offWhite text-black',
        type === 'secondary' &&
          'bg-[#1E1E1E] hover:bg-[#252525] active:bg-[#1E1E1E]',
        type === 'warning' && 'bg-warningRed hover:bg-[#e53c3c]',
        type === 'transparent' && '',
        disabled && 'opacity-50 pointer-events-none',
        className ?? ''
      )}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default Button;
