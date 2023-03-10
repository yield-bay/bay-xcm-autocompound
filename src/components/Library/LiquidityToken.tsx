import Image from 'next/image';
import ClientOnly from './ClientOnly';

interface LiquidityTokenProps {
  firstTokenSymbol: string;
  secondTokenSymbol: string;
}

function LiquidityToken({
  firstTokenSymbol,
  secondTokenSymbol,
}: LiquidityTokenProps) {
  const getImageBySymbol = (symbol: any) => {
    const imageMgx = (
      <Image
        src={'/image/mgx.svg'}
        alt={`${symbol} Token Icon`}
        width={24}
        height={24}
      />
    );
    const imageTur = (
      <Image
        src={'/image/tur.png'}
        alt={`${symbol} Token Icon`}
        width={24}
        height={24}
      />
    );
    const imageKsm = (
      <Image
        src={'/image/ksm.svg'}
        alt={`${symbol} Token Icon`}
        width={24}
        height={24}
      />
    );

    switch (symbol) {
      case 'TUR':
        return imageTur;
      case 'ROC':
        return imageKsm;
      case 'MGR':
      default:
        return imageMgx;
    }
  };

  return (
    <ClientOnly>
      {/* {getImageBySymbol(firstTokenSymbol)}
      {getImageBySymbol(secondTokenSymbol)} */}
      <div className="inline-block margin-left-12">
        {firstTokenSymbol}-{secondTokenSymbol}
      </div>
    </ClientOnly>
  );
}

export default LiquidityToken;
