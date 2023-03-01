import type { FC } from 'react';
// import MetaTags from '../Common/MetaTags';

const Loading: FC = () => {
  return (
    <div className="grid h-screen place-items-center bg-black">
      {/* <MetaTags /> */}
      <img
        className="h-28 w-28"
        height={112}
        width={112}
        src="/image/logo-mangata.png"
        alt="Logo"
      />
    </div>
  );
};

export default Loading;
