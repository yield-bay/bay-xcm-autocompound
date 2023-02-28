import Link from "next/link";
import ConnectWallet from "@components/Library/ConnectWallet";

export default function Header() {
  return (
    <div className="relative flex justify-between items-center w-full px-9 sm:px-11 lg:px-[120px] py-[38px] sm:py-12 z-10 font-bold text-base leading-6 sm:leading-8 transition duration-200">
      <Link href="/">
        <div className="flex flex-col justify-center cursor-pointer">
          <span className="font-bold font-spaceGrotesk text-lg sm:text-2xl leading-[23px] sm:leading-[30px]">
            yieldbay
          </span>
        </div>
      </Link>
      <div className="inline-flex items-center gap-x-4 sm:mr-2">
        <ConnectWallet />
      </div>
    </div>
  );
}
