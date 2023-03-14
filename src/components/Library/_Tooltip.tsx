import React from 'react';
import Tippy from '@tippyjs/react/headless';
import { satoshiFont } from '@utils/localFont';
import clsx from 'clsx';

type TooltipProps = {
  children: React.ReactElement;
  content: React.ReactElement;
  onButtonClick?: () => void;
};

function Tooltip({ children, content, onButtonClick }: TooltipProps) {
  return (
    <Tippy
      render={(attrs) => (
        <div
          className={clsx(
            'text-base leading-[21.6px] bg-baseGray font-sans font-medium text-white py-3 px-4 rounded-lg max-w-xs bg-baseBlue',
            'trnasition-all duration-100 ease-out',
            satoshiFont.variable
          )}
          tabIndex={-1}
          onClick={onButtonClick}
          {...attrs}
        >
          {content}
        </div>
      )}
    >
      {children}
    </Tippy>
  );
}
