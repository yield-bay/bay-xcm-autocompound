import { FC, useState, useEffect } from 'react';
import Link from 'next/link';
import { TabProps } from '@utils/types';
import { useAtom } from 'jotai';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import _ from 'lodash';
import moment from 'moment';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';

// Utils
import {
  account1Atom,
  mainModalOpenAtom,
  mangataHelperAtom,
  turingHelperAtom,
  turingAddressAtom,
  selectedTaskAtom,
  selectedEventAtom,
  compoundModalOpenAtom,
  compoundConfigAtom,
  stopCompModalOpenAtom,
} from '@store/commonAtoms';
import { accountAtom } from '@store/accountAtoms';
import { formatTokenSymbols, replaceTokenSymbols } from '@utils/farmMethods';
import { turTotalFees } from '@utils/turTotalFees';
import { fetchTokenPrices } from '@utils/fetch-prices';
import Tooltip from '@components/Library/Tooltip';
import RadioButton from '@components/Library/RadioButton';
import Button from '@components/Library/Button';
import ToastWrapper from '@components/Library/ToastWrapper';
import { IS_PRODUCTION } from '@utils/constants';

const CompoundTab: FC<TabProps> = ({ farm, pool }) => {
  const [open, setOpen] = useAtom(mainModalOpenAtom);
  const [account] = useAtom(accountAtom);
  const [account1] = useAtom(account1Atom);
  const [mangataHelper] = useAtom(mangataHelperAtom);
  const [turingHelper] = useAtom(turingHelperAtom);
  const [selectedTask] = useAtom(selectedTaskAtom);
  const [selectedEvent] = useAtom(selectedEventAtom);
  const [, setStopModalOpen] = useAtom(stopCompModalOpenAtom);
  const [, setIsOpenModal] = useAtom(compoundModalOpenAtom);
  const [, setCompoundConfig] = useAtom(compoundConfigAtom);
  const [turingAddress] = useAtom(turingAddressAtom);

  const [frequency, setFrequency] = useState<number>(1); // default day
  const [duration, setDuration] = useState<number>(7); // default week
  const [percentage, setPercentage] = useState<number>(100); // default 100%

  // Autocompounding states
  const [lastHarvested, setLastHarvested] = useState<any>(null);
  const [lastEstimatedExecTime, setLastEstimatedExecTime] = useState<any>(null);
  const [executionsTillNow, setExecutionsTillNow] = useState<any>(null);

  const [gasChoice, setGasChoice] = useState<number>(1); // default 0 == "MGX" / 1 == "TUR"
  const [totalFees, setTotalFees] = useState<number>(0);

  const [lpBalanceNum, setLpBalanceNum] = useState<number>(0);
  const [mgxBalance, setMgxBalance] = useState<number>(0);
  const [turBalance, setTurBalance] = useState<number>(0); // TUR balance on Mangata
  const [turBalanceTuring, setTurBalanceTuring] = useState<number>(0); // TUR balance on Turing
  const [isAutocompounding, setIsAutocompounding] = useState<boolean>(false);
  const [hasEvent, setHasEvent] = useState<boolean>(false);

  const toast = useToast();

  useEffect(() => {
    setIsAutocompounding(selectedTask?.status == 'RUNNING' ? true : false);
  }, [selectedTask]);

  useEffect(() => {
    setHasEvent(selectedEvent != undefined ? true : false);
    console.log('hasEvent', hasEvent);
    console.log(`selected event @${token0}-${token1}`, selectedEvent);
  }, []);

  // Calculate LP balance
  useEffect(() => {
    (async (pool) => {
      const lpBalance = await mangataHelper.mangata.getTokenBalance(
        pool.liquidityTokenId,
        account?.address
      );
      const decimal = mangataHelper.getDecimalsBySymbol(`${token0}-${token1}`);
      const tokenAmount =
        parseFloat(BigInt(lpBalance.free).toString(10)) / 10 ** decimal +
        parseFloat(BigInt(lpBalance.reserved).toString(10)) / 10 ** decimal;
      setLpBalanceNum(tokenAmount);
    })(pool);
  }, []);

  const [token0, token1] = formatTokenSymbols(
    IS_PRODUCTION
      ? farm?.asset.symbol!
      : replaceTokenSymbols(farm?.asset.symbol!)
  );

  const APY = ((farm?.apr.base + farm?.apr.reward) * percentage) / 100;
  const period = duration / frequency;
  const effectiveAPY = (((1 + APY / 100 / period) ** period - 1) * 100).toFixed(
    2
  );

  // Do this if task is already running (user is shown "Stop Autocompounding")
  useEffect(() => {
    console.log('hasEvent', hasEvent, 'open', open);
    (async () => {
      if (hasEvent && open) {
        try {
          console.log(
            'Fetching task data from chain...',
            selectedEvent,
            selectedEvent?.taskId as string
          );
          const accTasks =
            await turingHelper.api.query.automationTime.accountTasks(
              turingAddress,
              selectedEvent?.taskId as string // got taskId from graphql autocompoundEvents query: https://github.com/yield-bay/bay-api/blob/c9b35801543bcc6d325920ab3158e20a6f91c153/src/schema.graphql#L110
            );
          const task: any = accTasks.toHuman();
          console.log('accTasks', task, accTasks);
          const etslen = task?.schedule?.Fixed?.executionTimes?.length;
          const lastEstimatedExecTime =
            parseInt(
              task?.schedule?.Fixed?.executionTimes[etslen - 1].replaceAll(
                ',',
                ''
              ),
              10
            ) * 1000;
          console.log('lastEstimatedExecTime', lastEstimatedExecTime);
          const executionsLeft = parseInt(
            task?.schedule?.Fixed?.executionsLeft
          );
          if (etslen - executionsLeft - 1 == -1) {
            setLastHarvested('NA');
          } else {
            const lastHarvestTime =
              parseInt(
                task?.schedule?.Fixed?.executionTimes[
                  etslen - executionsLeft - 1
                ].replaceAll(',', ''),
                10
              ) * 1000;
            setLastHarvested(
              moment(new Date(lastHarvestTime)).format('DD/MM/YY')
            );
          }

          const executionsTillNow = etslen - executionsLeft;

          setLastEstimatedExecTime(
            moment(new Date(lastEstimatedExecTime)).format('DD/MM/YY')
          );
          setExecutionsTillNow(executionsTillNow);

          console.log(
            'lastHarvestTime',
            lastHarvested,
            new Date(lastHarvested),
            'lastEstimatedExecTime',
            lastEstimatedExecTime,
            new Date(lastEstimatedExecTime),
            'executionsLeft',
            executionsLeft,
            'executionsTillNow',
            executionsTillNow
          );
        } catch (error) {
          console.log('error in fetching task stats', error);
        }
      }
    })();
  }, [open, hasEvent]); // Need to reload this whenever modal is opened

  // Fetching MGX and TUR balance of connect account on Mangata Chain
  useEffect(() => {
    (async () => {
      if (account1) {
        // const mgrBalance = await mangataHelper.mangata?.getTokenBalance(
        //   '0', // MGR TokenId
        //   account1.address
        // );
        // const mgrBalanceFree =
        //   parseFloat(BigInt(mgrBalance.free).toString(10)) / 10 ** 18;
        // setMgxBalance(mgrBalanceFree);

        // TUR Balance on Mangata Network
        const turBalance = await mangataHelper.mangata?.getTokenBalance(
          '7', // TUR TokenId
          account1.address
        );
        const turBalanceFree =
          parseFloat(BigInt(turBalance.free).toString(10)) / 10 ** 10;
        setTurBalance(turBalanceFree);

        // TUR Balance on Turing Network
        const turBalanceTuring = await turingHelper.getBalance(turingAddress);
        const turFreeBalTuring =
          BigInt(turBalanceTuring.free).toString(10) / 10 ** 10;
        // const turFreeBalTuring = turBalanceTuring?.toHuman()?.free;
        setTurBalanceTuring(turFreeBalTuring);
      }
    })();
  }, [account1]);

  // Fetching TUR price in Dollar using react-query
  const { isLoading: isTurpriceLoading, data: turprice } = useQuery({
    queryKey: ['turprice'],
    queryFn: async () => {
      try {
        const tokenPrices = await fetchTokenPrices();
        console.log(`TUR price ${tokenPrices[2].price}`);
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
        freq,
        percentage
      );
      setTotalFees(feesInTUR ?? 0); // If fetched fees is null, set it to 0
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

  return (
    <div className="w-full relative flex flex-col gap-y-10 mt-10 text-xl leading-[27px]">
      {hasEvent && (
        <div className="rounded-lg bg-[#0C0C0C] text-center text-lg leading-6">
          <div className="py-7 text-[#C5C5C5] border-b border-[#2E2E2E]">
            Autocompounding {selectedEvent?.lp.amount.toFixed(2)}{' '}
            {selectedEvent?.lp.symbol} LP tokens{' '}
          </div>
          <div className="flex flex-row px-10 py-4 items-center w-full justify-between">
            <div>
              <p className="text-[#969595]">Last Harvested</p>
              <p className="text-2xl leading-8">{lastHarvested ?? 'NA'}</p>
            </div>
            <div>
              <p className="text-[#969595]">Last estimated execution</p>
              <p className="text-2xl leading-8">
                {lastEstimatedExecTime ?? 'NA'}
              </p>
            </div>
            <div>
              <div className="text-[#969595]">
                <p>Executions</p>
                <p>till now</p>
              </div>
              <p className="text-2xl leading-8">{executionsTillNow ?? '0'}</p>
            </div>
          </div>
        </div>
      )}
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
            isSelected={
              hasEvent ? selectedEvent?.duration === 7 : duration === 7
            }
            label="1 Week"
            value={7}
            disabled={hasEvent ? selectedEvent?.duration !== 7 : 7 < frequency}
            tooltip={
              7 < frequency && !hasEvent
                ? 'Frequency can not be more than duration!'
                : ''
            }
          />
          <RadioButton
            changed={setDuration}
            isSelected={
              hasEvent ? selectedEvent?.duration === 30 : duration === 30
            }
            label="1 Month"
            value={30}
            disabled={hasEvent && selectedEvent?.duration !== 30}
          />
          <RadioButton
            changed={setDuration}
            isSelected={
              hasEvent ? selectedEvent?.duration === 182 : duration === 182
            }
            label="6 Months"
            value={182}
            disabled={hasEvent && selectedEvent?.duration !== 182}
          />
        </div>
      </div>
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
            isSelected={
              hasEvent ? selectedEvent?.frequency === 1 : frequency === 1
            }
            label="Daily"
            value={1}
            disabled={hasEvent && selectedEvent?.frequency !== 1}
          />
          <RadioButton
            changed={setFrequency}
            isSelected={
              hasEvent ? selectedEvent?.frequency === 7 : frequency === 7
            }
            label="Weekly"
            value={7}
            disabled={hasEvent && selectedEvent?.frequency !== 7}
          />
          <RadioButton
            changed={setFrequency}
            isSelected={
              hasEvent ? selectedEvent?.frequency === 30 : frequency === 30
            }
            label="Monthly"
            value={30}
            disabled={
              hasEvent ? selectedEvent?.frequency !== 30 : 30 > duration
            }
            tooltip={
              30 > duration && !hasEvent
                ? 'Frequency can not be more than duration!'
                : ''
            }
          />
        </div>
      </div>
      <div>
        <p className="mb-3">Percentage</p>
        <p className="text-[#868686] mb-8 text-base leading-[21.6px]">
          Percentage of MGX reward to be Autocompounded
        </p>
        <div className="flex flex-row gap-x-8">
          <RadioButton
            changed={setPercentage}
            isSelected={
              hasEvent ? selectedEvent?.percentage === 25 : percentage === 25
            }
            label="25%"
            value={25}
            disabled={hasEvent && selectedEvent?.percentage !== 25}
          />
          <RadioButton
            changed={setPercentage}
            isSelected={
              hasEvent ? selectedEvent?.percentage === 50 : percentage === 50
            }
            label="50%"
            value={50}
            disabled={hasEvent && selectedEvent?.percentage !== 50}
          />
          <RadioButton
            changed={setPercentage}
            isSelected={
              hasEvent ? selectedEvent?.percentage === 100 : percentage === 100
            }
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
              {parseFloat(effectiveAPY)}%
              {/* <CountUp
                start={0}
                end={parseFloat(effectiveAPY)}
                decimals={2}
                decimal="."
                suffix="%"
                duration={0.75}
                delay={0}
              /> */}
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
              {!isNaN(turprice) && (
                <span className="text-white">{totalFees?.toFixed(2)} TUR</span>
              )}{' '}
              <span className="text-white">
                (${(totalFees * turprice).toFixed(2)})
              </span>{' '}
              including Gas Fees
            </p>
          )}
          <div className="inline-flex items-center gap-x-10">
            <RadioButton
              changed={setGasChoice}
              isSelected={gasChoice == 0}
              label={IS_PRODUCTION ? 'Pay with MGX' : 'Pay with MGR'}
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
            <span className="text-primaryGreen">Balance on Mangata:</span>
            {gasChoice == 0 ? (
              <span>
                {mgxBalance ?? 'loading...'} {IS_PRODUCTION ? 'MGX' : 'MGR'}
              </span>
            ) : (
              <p>
                {/* turBalance is in Mangata */}
                {turBalance.toFixed(2) ?? 'loading...'} TUR
                {!isNaN(turprice) && (
                  <span className="text-[#8A8A8A] ml-2">
                    ${(turBalance * turprice).toFixed(2)}
                  </span>
                )}
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
      {isAutocompounding ? (
        <div className="flex flex-col gap-y-2">
          <Button
            text="Stop Autocompounding"
            type="warning"
            onClick={() => {
              setOpen(false);
              setStopModalOpen(true);
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-y-2">
          <Button
            text={
              lpBalanceNum < 0.01
                ? 'Insufficient LP Token balance'
                : totalFees >= turBalance + turBalanceTuring
                ? 'Insufficient TUR balance'
                : 'Confirm'
            }
            type="primary"
            disabled={
              lpBalanceNum < 0.01 || totalFees >= turBalance + turBalanceTuring
            }
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
            type="transparent"
            onClick={() => {
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CompoundTab;
