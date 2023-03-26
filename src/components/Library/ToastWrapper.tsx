import { FC } from 'react';
import clsx from 'clsx';
import { satoshiFont } from '@utils/localFont';

interface Props {
  title: string;
  status: 'success' | 'error' | 'warning' | 'info';
}

const toaststatus = (status: 'success' | 'error' | 'warning' | 'info') => {
  switch (status) {
    case 'success':
      return 'border-[#43B8A1]';
    case 'warning':
      return 'border-[#FF916F]';
    case 'error':
      return 'border-[#D56969]';
    case 'info':
      return 'border-[#D8C76D]';
    default:
      return 'border-[#D8C76D]';
  }
};

const ToastWrapper: FC<Props> = ({ title, status }) => {
  return (
    <div
      className={clsx(
        'w-[471px] py-3 px-6 rounded-lg font-bold border text-base text-left bg-black leading-[21.6px] text-white font-sans',
        toaststatus(status),
        satoshiFont.variable
      )}
    >
      {title}
    </div>
  );
};

export default ToastWrapper;
