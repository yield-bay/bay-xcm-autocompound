import Image from 'next/image';

interface LiquidityTokenProps {
  firstTokenSymbol: string;
  secondTokenSymbol: string;
}

function LiquidityToken({ firstTokenSymbol, secondTokenSymbol }: LiquidityTokenProps) {
  const getImageBySymbol = (symbol: any) => {
    const imageMgx = (
      <Image src={"/image/mgx.svg"} alt={`${symbol} Token Icon`} width={24} height={24} />
    );
    const imageTur = (
      <Image src={"/image/tur.png"} alt={`${symbol} Token Icon`} width={24} height={24} />
    );
    const imageKsm = (
      <Image src={"/image/ksm.svg"} alt={`${symbol} Token Icon`} width={24} height={24} />
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
    <div>
      {getImageBySymbol(firstTokenSymbol)}
      {getImageBySymbol(secondTokenSymbol)}
      <div className="inline-block margin-left-12">
        {firstTokenSymbol}
        &nbsp;/&nbsp;
        {secondTokenSymbol}
      </div>
    </div>
  );
}

export default LiquidityToken;
