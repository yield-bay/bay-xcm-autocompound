import type { FC } from 'react';
import clsx from 'clsx';

interface ButtonProps {
  type: 'primary' | 'secondary' | 'warning';
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
        'text-center text-base leading-[21.6px] py-[9px] transition duration-100 ease-in-out rounded-lg',
        type === 'primary' && 'bg-white hover:bg-offWhite text-black',
        type === 'secondary' &&
          'bg-white bg-opacity-0 hover:bg-opacity-5 active:bg-opacity-0',
        type === 'warning' && 'bg-warningRed hover:bg-[#e53c3c]',
        disabled ? 'opacity-50 pointer-events-none' : '',
        className ?? ''
      )}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default Button;
