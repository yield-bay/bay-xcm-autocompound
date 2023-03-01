import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Providers from '@components/Common/Providers';
import { Suspense } from 'react';
import Loading from '@components/Common/Loading';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Suspense fallback={<Loading />}>
      <Providers>
        <Component {...pageProps} />;
      </Providers>
    </Suspense>
  );
}

export default MyApp;
