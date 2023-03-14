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
      return 'bg-[##43B8A1]';
    case 'warning':
      return 'bg-[#E8744F]';
    case 'error':
      return 'bg-[#D46969]';
    case 'info':
      return 'bg-[#D8C76D]';
    default:
      return 'bg-[##D8C76D]';
  }
};

const ToastWrapper: FC<Props> = ({ title, status }) => {
  return (
    <div
      className={clsx(
        'w-[500px] py-6 bg-baseGrayMid rounded-lg font-bold text-base text-center leading-[21.6px] text-black font-sans',
        toaststatus(status),
        satoshiFont.variable
      )}
    >
      {title}
    </div>
  );
};

export default ToastWrapper;
