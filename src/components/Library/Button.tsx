import type { FC } from 'react';
import clsx from 'clsx';

interface ButtonProps {
  type: 'primary' | 'secondary' | 'disabled';
  text: string;
  onClick?: () => void;
}

const Button: FC<ButtonProps> = ({ type, text, onClick }) => {
  return (
    <button
      className={clsx(
        'text-center w-full text-base bg-white hover:bg-offWhite leading-[21.6px] py-[9px] transition duration-100 ease-in-out rounded-lg',
        type === 'primary' && 'bg-white text-black',
        type === 'secondary' &&
          'bg-opacity-0 hover:bg-opacity-5 active:bg-opacity-0',
        type === 'disabled' && 'bg-opacity-50 pointer-events-none text-black'
      )}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default Button;
