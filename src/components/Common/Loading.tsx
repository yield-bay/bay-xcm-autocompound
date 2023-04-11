import Image from 'next/image';
import type { FC } from 'react';
import MetaTags from './metaTags/MetaTags';
// import MetaTags from '../Common/MetaTags';

const Loading: FC = () => {
  return (
    <div className="grid h-screen place-items-center bg-bgBlack">
      <MetaTags />
      <Image height={160} width={160} src="/image/app-logo.svg" alt="Logo" />
    </div>
  );
};

export default Loading;
