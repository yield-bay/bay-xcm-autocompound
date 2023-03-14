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
      return 'border-[##96E7D7]';
    case 'warning':
      return 'border-[#FF3F3F]';
    case 'error':
      return 'border-[#FF3F3F]';
    case 'info':
      return 'border-[#E7DA96]';
    default:
      return 'border-[##96E7D7]';
  }
};

const ToastWrapper: FC<Props> = ({ title, status }) => {
  return (
    <div
      className={clsx(
        'w-[500px] py-6 bg-baseGrayMid border-b-2 rounded-t-lg font-bold text-base text-center leading-[21.6px] text-white font-sans',
        toaststatus(status),
        satoshiFont.variable
      )}
    >
      {title}
    </div>
  );
};

export default ToastWrapper;
