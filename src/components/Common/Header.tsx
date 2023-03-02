import Link from 'next/link';
import ConnectWallet from '@components/Library/ConnectWallet';
import { YIELDBAY_LANDING } from '@utils/constants';

export default function Header() {
  return (
    <div className=" w-full px-9 sm:px-11 xl:px-0 py-[38px] sm:py-14 z-10 font-bold text-base leading-6 sm:leading-8 transition duration-200">
      <div className="flex justify-between items-start mx-auto  max-w-[1138px]">
        <div className="flex flex-col gap-y-4 ">
          <p className="text-4xl leading-9 max-w-lg">
            explore & autocompound liquidity pools on{' '}
            <span className="text-primaryGreen">mangataX</span>
          </p>
          <p>
            by <Link href={YIELDBAY_LANDING} target='_blank' rel='noreferrer' className='underline underline-offset-4'>yieldbay</Link>
          </p>
        </div>
        <ConnectWallet />
      </div>
    </div>
  );
}
