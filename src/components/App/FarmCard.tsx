import { FC, useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import Image from 'next/image';
import clsx from 'clsx';
import { useAtom } from 'jotai';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
// import { motion } from 'framer-motion';
import ToastWrapper from '@components/Library/ToastWrapper';
import FarmAssets from '@components/Library/FarmAssets';
import toDollarUnits, {
  formatFarmType,
  formatTokenSymbols,
  replaceTokenSymbols,
} from '@utils/farmMethods';
import { AutocompoundEventType, FarmType, XcmpTaskType } from '@utils/types';
import { accountAtom } from '@store/accountAtoms';
import {
  mainModalOpenAtom,
  mangataHelperAtom,
  poolsAtom,
  selectedEventAtom,
  selectedFarmAtom,
  selectedTabModalAtom,
  selectedTaskAtom,
  viewPositionsAtom,
} from '@store/commonAtoms';
import Tooltip from '@components/Library/Tooltip';
import _ from 'lodash';

interface Props {
  farm: FarmType;
  xcmpTask: XcmpTaskType | undefined;
  autocompoundEvent: AutocompoundEventType | undefined;
  mgxBalance: number;
}

const FarmCard: FC<Props> = ({
  farm,
  xcmpTask,
  autocompoundEvent,
  mgxBalance,
}) => {
  const [, setOpen] = useAtom(mainModalOpenAtom);
  const [, setSelectedTab] = useAtom(selectedTabModalAtom);
  const [, setSelectedFarm] = useAtom(selectedFarmAtom);
  const [, setSelectedTask] = useAtom(selectedTaskAtom);
  const [, setSelectedEvent] = useAtom(selectedEventAtom);
  const [account] = useAtom(accountAtom);
  const [viewPositions] = useAtom(viewPositionsAtom);
  const [mangataHelper] = useAtom(mangataHelperAtom);
  const [pools] = useAtom(poolsAtom);

  const [lpBalanceNum, setLpBalanceNum] = useState(0.0);

  const tokenNames = formatTokenSymbols(
    replaceTokenSymbols(farm?.asset.symbol)
  );
  const [token0, token1] = tokenNames;
  const isCompounding = xcmpTask?.status == 'RUNNING' ? true : false;

  const toast = useToast();

  // Calculate LP balance
  useEffect(() => {
    (async () => {
      if (pools == null) return;
      if (token0 == 'ZLK') return;
      if (account == null) return;

      // Make a state for this
      const pool = _.find(pools, {
        firstTokenId: mangataHelper.getTokenIdBySymbol(token0),
        secondTokenId: mangataHelper.getTokenIdBySymbol(token1),
      });

      const lpBalance = await mangataHelper.mangata.getTokenBalance(
        pool.liquidityTokenId,
        account?.address
      );

      const decimal = mangataHelper.getDecimalsBySymbol(`${token0}-${token1}`);
      const tokenAmount =
        parseFloat(BigInt(lpBalance.free).toString(10)) / 10 ** decimal +
        parseFloat(BigInt(lpBalance.reserved).toString(10)) / 10 ** decimal;
      setLpBalanceNum(tokenAmount);
    })();
  }, [pools]);

  return (
    <div
      className={clsx(
        viewPositions ? (lpBalanceNum > 0.0 ? 'flex' : 'hidden') : 'flex',
        'flex-row w-full bg-baseGrayDark hover:ring-[1px] transition duration-20 ring-primaryGreen rounded-lg'
      )}
      // initial={{ opacity: '0' }}
      // animate={{ opacity: '100%', y: '0' }}
      // whileInView={{ opacity: '100%' }}
      // transition={{ duration: 0.2, type: 'spring' }}
    >
      {/* LEFT */}
      <div className="flex flex-row items-center justify-between px-6 py-14 w-full max-w-[400px] rounded-l-lg bg-card-gradient">
        {/* Assets and Farm Type */}
        <div className="flex flex-col gap-y-[10px]">
          <div className="flex flex-row gap-x-3">
            <FarmAssets logos={farm?.asset.logos} />
            <div className="py-[9px] select-none px-4 bg-white text-xs text-black rounded-full">
              {formatFarmType(farm?.farmType)}
            </div>
          </div>
          <p className="text-2xl text-offWhite">
            {tokenNames.map((tokenName, index) => (
              <span key={index} className="mr-[3px]">
                {tokenName}
                {index !== tokenNames.length - 1 && ' •'}
              </span>
            ))}
          </p>
        </div>
        {/* -- Not required for now */}
        {/* <button className="rounded-full scale-0 group-hover:scale-100 bg-white p-[10px] h-fit hover:bg-offWhite text-black transition-all duration-200">
          <Image
            height={28}
            width={28}
            src="/icons/ArrowRight.svg"
            alt="Right Arrow"
          />
        </button> */}
      </div>
      {/* RIGHT SIDE */}
      <div className="flex flex-row pl-8 pr-7 py-6 justify-between w-full rounded-r-lg">
        {/* Right Left */}
        <div className="flex flex-col justify-between">
          <div className="flex flex-col">
            <p className="font-medium text-base leading-5 opacity-50">TVL</p>
            <p className="text-2xl">{toDollarUnits(farm?.tvl)}</p>
          </div>
          <div className="flex flex-col">
            <p className="font-medium text-base leading-5 opacity-50">APR</p>
            <div className="flex flex-row items-center gap-x-4">
              <p className="text-2xl">
                {(farm?.apr.reward + farm?.apr.base).toFixed(2)}%
              </p>
              <Tooltip
                label={
                  <>
                    <p>
                      <span className="opacity-50 mr-2">Base</span>
                      {farm?.apr.base.toFixed(2)}%
                    </p>
                    <p>
                      <span className="opacity-50 mr-2">Reward</span>
                      {farm?.apr.reward.toFixed(2)}%
                    </p>
                  </>
                }
              >
                <QuestionMarkCircleIcon className="w-5 h-5 opacity-50" />
              </Tooltip>
            </div>
          </div>
        </div>
        {/* Right Right */}
        <div className="relative flex flex-col justify-between">
          {isCompounding && (
            <div className="hidden lg:inline-flex select-none drop-shadow-xl gap-x-2 absolute right-[186px] font-medium text-[#868686] text-base leading-[21.6px]">
              <Image
                src="/icons/ThunderIcon.svg"
                alt="active autocompounding"
                width={16}
                height={16}
              />
              <span>Autocompounding</span>
            </div>
          )}
          {lpBalanceNum == 0 ? (
            <button
              className="bg-baseGray py-4 px-5 text-white text-base leading-5 hover:ring-1 ring-baseGrayLow rounded-lg transition duration-200"
              onClick={() => {
                if (account == null) {
                  toast({
                    position: 'top',
                    duration: 3000,
                    render: () => (
                      <ToastWrapper
                        title="Please Connect Wallet"
                        status="error"
                      />
                    ),
                  });
                } else {
                  setSelectedTab(1);
                  setOpen(true);
                  setSelectedFarm(farm);
                  setSelectedTask(xcmpTask);
                  setSelectedEvent(autocompoundEvent);
                }
              }}
            >
              <p>Add/Remove</p>
              <p>Liquidity</p>
            </button>
          ) : (
            <button className="flex flex-col items-center bg-[#151414] py-2 px-5 ring-1 ring-primaryGreen rounded-lg transition duration-200 pointer-events-none">
              <p className="text-[#868686] font-medium text-base leading-[#21.6px]">
                You Deposited
              </p>
              <p className="text-2xl leading-8 text-white">
                {lpBalanceNum.toFixed(2)} LP
              </p>
            </button>
          )}
          <Tooltip
            label={
              mgxBalance < 5000
                ? 'Need a minimum of 5000 MGX as free balance to autocompound.'
                : ''
            }
            placement="left"
          >
            <button
              className={clsx(
                'px-4 py-3 rounded-lg bg-white hover:bg-offWhite hover:ring-1 ring-offWhite active:ring-0 text-black transition duration-200',
                mgxBalance < 5000
                  ? 'hover:ring-0 hover:bg-white opacity-50 cursor-default'
                  : ''
              )}
              onClick={() => {
                if (account == null) {
                  toast({
                    position: 'top',
                    duration: 3000,
                    render: () => (
                      <ToastWrapper
                        title="Please Connect Wallet"
                        status="error"
                      />
                    ),
                  });
                } else {
                  setSelectedTab(0);
                  setOpen(true);
                  setSelectedFarm(farm);
                  setSelectedTask(xcmpTask);
                  setSelectedEvent(autocompoundEvent);
                }
              }}
              // disabled={mgxBalance < 5000}
            >
              {lpBalanceNum == 0 ? 'Autocompound' : 'Manage'}
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default FarmCard;
