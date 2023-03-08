import React from 'react';
import Tippy from '@tippyjs/react/headless';
import { satoshiFont } from '@utils/localFont';
import clsx from 'clsx';
import { useSpring, motion } from 'framer-motion';

type TooltipProps = {
  children: React.ReactElement;
  content: React.ReactElement;
  onButtonClick?: () => void;
};

export default function Tooltip({
  children,
  content,
  onButtonClick,
}: TooltipProps) {
  // const springConfig = { damping: 15, stiffness: 300 };
  // const initialScale = 0.5;
  // const opacity = useSpring(0, springConfig);
  // const scale = useSpring(initialScale, springConfig);

  // function onMount() {
  //   scale.set(1);
  //   opacity.set(1);
  // }

  // function onHide({ unmount }: any) {
  //   const cleanup = scale.onChange((value: any) => {
  //     if (value <= initialScale) {
  //       cleanup();
  //       unmount();
  //     }
  //   });

  //   scale.set(initialScale);
  //   opacity.set(0);
  // }

  return (
    <Tippy
      render={(attrs) => (
        <div
          className={clsx(
            'text-base leading-[21.6px] bg-baseGray font-sans font-medium text-white py-3 px-4 rounded-lg max-w-xs bg-baseBlue',
            satoshiFont.variable
          )}
          tabIndex={-1}
          onClick={onButtonClick}
          {...attrs}
        >
          {content}
        </div>
      )}
      // animation={true}
      // onMount={onMount}
      // onHide={onHide}
    >
      {children}
    </Tippy>
  );
}
