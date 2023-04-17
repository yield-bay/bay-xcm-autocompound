import { FC, useState, useEffect } from 'react';
import Link from 'next/link';
import { TabProps, TokenType } from '@utils/types';
import { useAtom } from 'jotai';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import _ from 'lodash';
import moment from 'moment';
import CountUp from 'react-countup';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';

// Utils
import {
  account1Atom,
  mainModalOpenAtom,
  mangataHelperAtom,
  turingHelperAtom,
  turingAddressAtom,
  mangataAddressAtom,
  selectedTaskAtom,
  selectedEventAtom,
  taskModalOpenAtom,
  trxnProcessAtom,
  userHasProxyAtom,
  compoundModalOpenAtom,
  compoundConfigAtom,
} from '@store/commonAtoms';
import { delay, getDecimalBN } from '@utils/xcm/common/utils';
import { accountAtom } from '@store/accountAtoms';
import { formatTokenSymbols, replaceTokenSymbols } from '@utils/farmMethods';
import { turTotalFees } from '@utils/turTotalFees';
import { fetchTokenPrices } from '@utils/fetch-prices';
import Tooltip from '@components/Library/Tooltip';
import RadioButton from '@components/Library/RadioButton';
import Button from '@components/Library/Button';
import ToastWrapper from '@components/Library/ToastWrapper';
import Loader from '@components/Library/Loader';
import { useMutation } from 'urql';
import {
  AddXcmpTaskMutation,
  createAutocompoundEventMutation,
} from '@utils/api';
import Stepper from '@components/Library/Stepper';

const CompoundTab: FC<TabProps> = ({ farm, pool }) => {
  const [, setOpen] = useAtom(mainModalOpenAtom);
  const [account] = useAtom(accountAtom);
  const [account1] = useAtom(account1Atom);
  const [mangataHelper] = useAtom(mangataHelperAtom);
  const [turingHelper] = useAtom(turingHelperAtom);
  const [selectedTask] = useAtom(selectedTaskAtom);
  const [selectedEvent] = useAtom(selectedEventAtom);
  const [, setStopModalOpen] = useAtom(taskModalOpenAtom);
  const [, setIsOpenModal] = useAtom(compoundModalOpenAtom);
  const [, setCompoundConfig] = useAtom(compoundConfigAtom);

  const [frequency, setFrequency] = useState<number>(1); // default day
  const [duration, setDuration] = useState<number>(7); // default week
  const [percentage, setPercentage] = useState<number>(100); // default 100%

  const [gasChoice, setGasChoice] = useState<number>(1); // default 0 == "MGX" / 1 == "TUR"
  const [totalFees, setTotalFees] = useState<number>(0);

  const [lpBalanceNum, setLpBalanceNum] = useState<number>(0);
  const [mgxBalance, setMgxBalance] = useState<number>(0);
  const [turBalance, setTurBalance] = useState<number>(0);
  const [turingAddress] = useAtom(turingAddressAtom);

  const toast = useToast();
  const isAutocompounding = selectedTask?.status == 'RUNNING' ? true : false;
  const hasEvent = selectedEvent != undefined ? true : false;

  useEffect(() => {
    console.log('hasEvent', hasEvent);
    console.log(`selected event @${token0}-${token1}`, selectedEvent);
  }, [hasEvent]);

  const [token0, token1] = formatTokenSymbols(
    replaceTokenSymbols(farm?.asset.symbol)
  );

  const APY = farm?.apr.base + farm?.apr.reward;
  const period = duration / frequency;
  const effectiveAPY = (((1 + APY / 100 / period) ** period - 1) * 100).toFixed(
    2
  );

  // Do this if task is already running (user is shown "Stop Autocompounding")
  useEffect(() => {
    (async () => {
      if (!isAutocompounding) return;
      console.log('turingAddress', turingAddress);

      const accTasks = await turingHelper.api.query.automationTime.accountTasks(
        turingAddress,
        '0x5d101a7f34d2b6471b6a0ae962d7c4504d59ca708e03953f4d4da24a50d6b33c' // get taskId from graphql autocompoundEvents query: https://github.com/yield-bay/bay-api/blob/c9b35801543bcc6d325920ab3158e20a6f91c153/src/schema.graphql#L110
      );
      const task: any = accTasks.toHuman();
      console.log('accTasks', task, accTasks);
      const etslen = task?.schedule?.Fixed?.executionTimes?.length;
      const lastEstimatedExecTime =
        parseInt(
          task?.schedule?.Fixed?.executionTimes[etslen - 1].replaceAll(',', ''),
          10
        ) * 1000;
      console.log('lastEstimatedExecTime', lastEstimatedExecTime);
      const executionsLeft = parseInt(task?.schedule?.Fixed?.executionsLeft);
      const lastHarvestTime =
        parseInt(
          task?.schedule?.Fixed?.executionTimes[
            etslen - executionsLeft - 1
          ].replaceAll(',', ''),
          10
        ) * 1000;
      const executionsTillNow = etslen - executionsLeft;
      console.log(
        'lastHarvestTime',
        lastHarvestTime,
        new Date(lastHarvestTime),
        'lastEstimatedExecTime',
        lastEstimatedExecTime,
        new Date(lastEstimatedExecTime),
        'executionsLeft',
        executionsLeft,
        'executionsTillNow',
        executionsTillNow
      );
    })();
  }, [account1, turingAddress]);

  // Fetching MGX and TUR balance of connect account on Mangata Chain
  useEffect(() => {
    (async () => {
      if (account1) {
        const mgrBalance = await mangataHelper.mangata?.getTokenBalance(
          '0', // MGR TokenId
          account1.address
        );

        const turBalance = await mangataHelper.mangata?.getTokenBalance(
          '7', // TUR TokenId
          account1.address
        );

        const mgrBalanceFree = mgrBalance.free
          .div(getDecimalBN(18)) // MGR decimals = 18
          .toNumber();
        setMgxBalance(mgrBalanceFree);
        const turBalanceFree = turBalance.free
          .div(getDecimalBN(10)) // TUR decimals = 10
          .toNumber();
        setTurBalance(turBalanceFree);
      }
    })();
  }, [account1]);

  // Fetching TUR price in Dollar
  const { isLoading: isTurpriceLoading, data: turprice } = useQuery({
    queryKey: ['turprice'],
    queryFn: async () => {
      try {
        const tokenPrices = await fetchTokenPrices();
        return tokenPrices[2].price; // TUR price in Dollar
      } catch (error) {
        console.log('error: fetching turprice', error);
        toast({
          position: 'top',
          duration: 3000,
          render: () => (
            <ToastWrapper title="Unable to fetch TUR price." status="error" />
          ),
        });
      }
    },
  });

  const fetchTurTotalFees = async () => {
    console.log('Fetching fees...');
    setTotalFees(0);
    try {
      let freq = frequency;
      let dur = duration;
      if (frequency == 7 && duration == 7) {
        console.log('77 edge case');
        freq = 6;
      }
      if (frequency == 30 && duration == 30) {
        console.log('3030 edge case');
        freq = 29;
      }
      const feesInTUR = await turTotalFees(
        pool,
        mangataHelper,
        turingHelper,
        account,
        duration,
        // frequency,
        freq,
        percentage
      );
      setTotalFees(feesInTUR as number);
    } catch (error) {
      console.log('error: Fetching fees', error);
      toast({
        position: 'top',
        duration: 3000,
        render: () => (
          <ToastWrapper title="Unable to fetch Fees." status="error" />
        ),
      });
    }
  };
  // Fetch pool Just in time
  useEffect(() => {
    fetchTurTotalFees();
  }, [frequency, duration, percentage]);

  // Calculate LP balance
  useEffect(() => {
    (async () => {
      const lpBalance = await mangataHelper.mangata.getTokenBalance(
        pool.liquidityTokenId,
        account?.address
      );
      // setLpBalance(lpBalance);
      const decimal = mangataHelper.getDecimalsBySymbol(`${token0}-${token1}`);
      const tokenAmount =
        parseFloat(BigInt(lpBalance.free).toString(10)) / 10 ** decimal +
        parseFloat(BigInt(lpBalance.reserved).toString(10)) / 10 ** decimal;
      console.log('tokenAmount total', tokenAmount);
      setLpBalanceNum(tokenAmount);
    })();
  }, []);

  return (
    <div className="w-full relative flex flex-col gap-y-10 mt-10 text-xl leading-[27px]">
      {hasEvent && (
        <div className="rounded-lg bg-[#0C0C0C] text-center text-lg leading-6">
          <div className="py-7 text-[#C5C5C5] border-b border-[#2E2E2E]">
            Autocompounding 100 MGX-TUR LP tokens{' '}
          </div>
          <div className="flex flex-row px-14 py-4 items-center w-full justify-between">
            <div className="">
              <p className="text-[#969595]">Last Harvested</p>
              <p className="text-2xl leading-8">5/6/23</p>
            </div>
            <div className="">
              <p className="text-[#969595]">Last estimated execution</p>
              <p className="text-2xl leading-8">5/6/23</p>
            </div>
            <div className="">
              <p className="text-[#969595]">Executions till now</p>
              <p className="text-2xl leading-8">25</p>
            </div>
          </div>
        </div>
      )}
      <div>
        <p className="inline-flex items-center mb-8">
          Frequency
          <Tooltip label="Frequency of auto-compounding">
            <QuestionMarkCircleIcon className="h-5 w-5 opacity-50 ml-3" />
          </Tooltip>
        </p>
        <div className="flex flex-row gap-x-8">
          <RadioButton
            changed={setFrequency}
            isSelected={frequency === 1}
            label="Daily"
            value={1}
            disabled={hasEvent && selectedEvent?.frequency !== 1}
          />
          <RadioButton
            changed={setFrequency}
            isSelected={frequency === 7}
            label="Weekly"
            value={7}
            disabled={hasEvent && selectedEvent?.frequency !== 7}
          />
          <RadioButton
            changed={setFrequency}
            isSelected={frequency === 30}
            label="Monthly"
            value={30}
            disabled={
              (hasEvent && selectedEvent?.frequency !== 30) || 30 > duration
            }
            tooltip={
              30 > duration ? 'Frequency can not be more than duration!' : ''
            }
          />
        </div>
      </div>
      <div>
        <p className="inline-flex items-center mb-8">
          Duration
          <Tooltip label="Time period for which the task will run">
            <QuestionMarkCircleIcon className="h-5 w-5 opacity-50 ml-3" />
          </Tooltip>
        </p>
        <div className="flex flex-row gap-x-8">
          <RadioButton
            changed={setDuration}
            isSelected={duration === 7}
            label="1 Week"
            value={7}
            disabled={
              (hasEvent && selectedEvent?.duration !== 7) || 7 < frequency
            }
            tooltip={
              7 < frequency ? 'Frequency can not be more than duration!' : ''
            }
          />
          <RadioButton
            changed={setDuration}
            isSelected={duration === 30}
            label="1 Month"
            value={30}
            disabled={hasEvent && selectedEvent?.duration !== 30}
          />
          <RadioButton
            changed={setDuration}
            isSelected={duration === 182}
            label="6 Months"
            value={182}
            disabled={hasEvent && selectedEvent?.duration !== 182}
          />
        </div>
      </div>
      <div>
        <p className="inline-flex items-center mb-8">
          Percentage
          <Tooltip label="Percentage of yield to be compounded">
            <QuestionMarkCircleIcon className="h-5 w-5 opacity-50 ml-3" />
          </Tooltip>
        </p>
        <div className="flex flex-row gap-x-8">
          <RadioButton
            changed={setPercentage}
            isSelected={percentage === 25}
            label="25%"
            value={25}
            disabled={hasEvent && selectedEvent?.percentage !== 25}
          />
          <RadioButton
            changed={setPercentage}
            isSelected={percentage === 50}
            label="50%"
            value={50}
            disabled={hasEvent && selectedEvent?.percentage !== 50}
          />
          <RadioButton
            changed={setPercentage}
            isSelected={percentage === 100}
            label="100%"
            value={100}
            disabled={hasEvent && selectedEvent?.percentage !== 100}
          />
        </div>
      </div>
      {/* Card box to show current and effective APY */}
      <div className="inline-flex justify-between w-full rounded-lg bg-[#1C1C1C] py-6 px-9">
        <Tooltip label="Without auto-compounding" placement="top">
          <div className="flex flex-col items-center gap-y-3">
            <p className="text-xl font-medium opacity-60">Current APR</p>
            <p className="text-2xl">{APY.toFixed(2)}%</p>
          </div>
        </Tooltip>
        <Tooltip label="With auto-compounding" placement="top">
          <div className="flex flex-col items-center gap-y-3">
            <p className="text-xl font-medium opacity-60">Effective APR</p>
            <p className="text-2xl">
              <CountUp
                start={0}
                end={parseFloat(effectiveAPY)}
                decimals={2}
                decimal="."
                suffix="%"
                duration={0.75}
                delay={0}
              />
            </p>
          </div>
        </Tooltip>
      </div>
      {!hasEvent && (
        <div className="flex flex-col gap-y-12 text-base leading-[21.6px] font-bold items-center">
          {isTurpriceLoading || totalFees == 0 ? (
            <p className="text-[#B9B9B9] mr-2">Calculating fees...</p>
          ) : (
            <p className="text-[#B9B9B9]">
              Costs{' '}
              <span className="text-white">
                ${(totalFees * turprice).toFixed(2)}
              </span>{' '}
              <span className="text-white">({totalFees?.toFixed(2)} TUR)</span>{' '}
              including Gas Fees
            </p>
          )}
          <div className="inline-flex items-center gap-x-10">
            <RadioButton
              changed={setGasChoice}
              isSelected={gasChoice == 0}
              label="Pay with MGR"
              value={0}
              className={gasChoice == 0 ? '' : 'opacity-50'}
              disabled
              tooltip="Coming Soon"
            />
            <RadioButton
              changed={setGasChoice}
              isSelected={gasChoice == 1}
              label="Pay with TUR"
              value={1}
              className={gasChoice == 1 ? '' : 'opacity-50'}
            />
          </div>
          <div className="inline-flex gap-x-2 rounded-lg bg-[#232323] py-4 px-6 select-none">
            <span className="text-primaryGreen">Balance:</span>
            {gasChoice == 0 ? (
              <span>{mgxBalance ?? 'loading...'} MGR</span>
            ) : (
              <p>
                {turBalance ?? 'loading...'} TUR
                <span className="text-[#8A8A8A] ml-2">
                  ${!isNaN(turprice) && (turBalance * turprice).toFixed(3)}
                </span>
              </p>
            )}
          </div>
          <Link
            href="https://mangata-finance.notion.site/How-to-get-TUR-bdb76dac848f4d15bf06bec7ded223ad"
            target="_blank"
            rel="noreferrer"
            className="hover:text-primaryGreen text-sm -mt-8 underline underline-offset-2"
          >
            How to get TUR?
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-y-2">
        <Button
          text="Confirm"
          type="primary"
          onClick={() => {
            setOpen(false);
            setIsOpenModal(true);
            setCompoundConfig({
              frequency,
              duration,
              percentage,
              gasChoice,
            });
          }}
        />
        <Button
          text="Cancel"
          type="secondary"
          onClick={() => {
            setOpen(false);
          }}
        />
      </div>
    </div>
  );
};

export default CompoundTab;
