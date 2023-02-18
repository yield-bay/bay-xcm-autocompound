import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

const Home: NextPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Head>
        <title>Mangata App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex w-full flex-1 flex-col items-center justify-center px-10 text-center max-w-fit">
        <Link href="/wallet"><p className='underline'>Go to wallet</p></Link>
      </main>
    </div>
  );
};

export default Home;
