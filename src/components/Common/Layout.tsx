import type { FC, ReactNode } from 'react';
import { useIsMounted } from '@hooks/useIsMounted';
import Loading from '@components/Common/Loading';
import clsx from 'clsx';
import { satoshiFont } from '@utils/localFont';
import ConnectModal from '@components/Library/ConnectModal';
import CompoundModal from '@components/Home/CompoundModal';
import Header from './Header';

interface Props {
  children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
  const { mounted } = useIsMounted();

  if (!mounted) {
    return <Loading />;
  }

  return (
    <div
      className={clsx(
        'flex flex-col min-h-screen w-full font-sans text-white font-bold tracking-wide bg-bgBlack bg-bg-pattern',
        satoshiFont.variable
      )}
    >
      <ConnectModal />
      <CompoundModal />
      <div className='flex flex-col flex-1'>
        <Header />
        {children}
      </div>
    </div>
  );
};

export default Layout;
