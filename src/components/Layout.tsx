import type { FC, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
  return (
    <div className='flex flex-col min-h-screen font-inter bg-black text-white'>
      {children}
    </div>
  );
};

export default Layout;
