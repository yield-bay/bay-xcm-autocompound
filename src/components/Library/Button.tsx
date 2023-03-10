import type { FC } from 'react';
import clsx from 'clsx';

interface ButtonProps {
  type: 'primary' | 'secondary' | 'disabled' | 'warning';
  text: string;
  onClick?: () => void;
  className?: string;
}

const Button: FC<ButtonProps> = ({ type, text, onClick, className }) => {
  return (
    <button
      className={clsx(
        'text-center text-base leading-[21.6px] py-[9px] transition duration-100 ease-in-out rounded-lg',
        type === 'primary' && 'bg-white hover:bg-offWhite text-black',
        type === 'secondary' &&
          'bg-white bg-opacity-0 hover:bg-opacity-5 active:bg-opacity-0',
        type === 'disabled' &&
          'bg-white bg-opacity-50 pointer-events-none text-black',
        type === 'warning' && 'bg-warningRed hover:bg-[#e53c3c]',
        className ?? ''
      )}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default Button;
