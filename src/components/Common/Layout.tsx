import type { FC, ReactNode } from 'react';
import { useIsMounted } from '@hooks/useIsMounted';
import Loading from '@components/Common/Loading';

interface Props {
  children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
  const { mounted } = useIsMounted();

  if (!mounted) {
    return <Loading />;
  }

  return (
    <div className="flex font-sans flex-col min-h-screen font-inter bg-black text-white">
      {children}
    </div>
  );
};

export default Layout;
