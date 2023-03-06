import type { FC, ReactNode } from 'react';
import { useIsMounted } from '@hooks/useIsMounted';
import Loading from '@components/Common/Loading';
import clsx from 'clsx';
import { satoshiFont } from '@utils/localFont'; 

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
        'flex flex-col min-h-screen text-white font-bold tracking-wide bg-bgBlack bg-bg-pattern font-sans',
        satoshiFont.variable
      )}
    >
      {children}
    </div>
  );
};

export default Layout;
