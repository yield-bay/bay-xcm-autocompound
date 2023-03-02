import { memo } from 'react';
import Image from 'next/image';

type FarmAssetsProps = {
  logos: string[];
};

const FarmAssets = ({ logos }: FarmAssetsProps) => {
  return (
    <div className="flex justify-start sm:justify-end">
      <div className="flex flex-row items-center justify-center -space-x-1">
        {logos.map((logo: string, index: number) => (
          <div
            key={index}
            className="z-10 flex overflow-hidden rounded-full bg-neutral-800 transition duration-200"
          >
            <Image src={logo} alt={logo} width={32} height={32} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(FarmAssets);
