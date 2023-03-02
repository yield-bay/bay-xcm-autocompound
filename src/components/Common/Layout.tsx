import type { FC, ReactNode } from 'react';
import { useIsMounted } from '@hooks/useIsMounted';
import Loading from '@components/Common/Loading';
import Image from 'next/image';

interface Props {
  children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
  const { mounted } = useIsMounted();

  if (!mounted) {
    return <Loading />;
  }

  return (
    <div className="flex font-sans flex-col min-h-screen text-white font-bold tracking-wide bg-bgBlack bg-bg-pattern">
      {children}
    </div>
  );
};

export default Layout;
