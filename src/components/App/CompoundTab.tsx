import { FC, useState, useEffect, useRef } from 'react';
import { TabProps, TokenType } from '@utils/types';
import { useAtom } from 'jotai';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import _ from 'lodash';
import moment from 'moment';
import CountUp from 'react-countup';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';
// import DownSignal from '@components/Library/DownSignal';

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
  stopCompModalOpenAtom,
} from '@store/commonAtoms';
import { delay, getDecimalBN } from '@utils/xcm/common/utils';
import { accountAtom } from '@store/accountAtoms';
import { formatTokenSymbols, replaceTokenSymbols } from '@utils/farmMethods';
import { turTotalFees } from '@utils/turTotalFees';
import { fetchTokenPrices } from '@utils/fetch-prices';
import Tooltip from '@components/Library/Tooltip';
import RadioButton from '@components/Library/RadioButton';
import Button from '@components/Library/Button';
import ProcessStepper from '@components/Library/ProcessStepper';
import ToastWrapper from '@components/Library/ToastWrapper';
import Loader from '@components/Library/Loader';
import { getDecimalById } from '@utils/mangata-helpers';
import { useMutation } from 'urql';
import {
  AddXcmpTaskMutation,
  createAutocompoundEventMutation,
} from '@utils/api';

const CompoundTab: FC<TabProps> = ({ farm, pool }) => {
  const [, setOpen] = useAtom(mainModalOpenAtom);
  const [account] = useAtom(accountAtom);
  const [account1] = useAtom(account1Atom);
  const [mangataHelper] = useAtom(mangataHelperAtom);
  const [turingHelper] = useAtom(turingHelperAtom);
  const [selectedTask] = useAtom(selectedTaskAtom);
  const [selectedEvent] = useAtom(selectedEventAtom);
  const [, setStopModalOpen] = useAtom(stopCompModalOpenAtom);

  const [frequency, setFrequency] = useState<number>(1); // default day
  const [duration, setDuration] = useState<number>(7); // default week
  const [percentage, setPercentage] = useState<number>(25); // default 25%

  const [gasChoice, setGasChoice] = useState<number>(1); // default 0 == "MGX" / 1 == "TUR"
  const [taskId, setTaskId] = useState<any>('');
  const [executionFee, setExecutionFee] = useState<number>(0);
  const [xcmpFee, setXcmpFee] = useState<number>(0);
  const [totalFees, setTotalFees] = useState<number>(0);
  const [mangataProxyCallFees, setMangataProxyCallFees] = useState<any>(null);
  const [encodedMangataProxyCall, setEncodedMangataProxyCall] =
    useState<any>(null);
  const [executionTimes, setExecutionTimes] = useState<any>(null);
  const [providedId, setProvidedId] = useState<string>();

  const [lpBalance, setLpBalance] = useState<any>();
  const [lpBalanceNum, setLpBalanceNum] = useState<number>(0);
  const [mgxBalance, setMgxBalance] = useState<number>(0);
  const [turBalance, setTurBalance] = useState<number>(0);

  const [mangataAddress] = useAtom(mangataAddressAtom);
  const [turingAddress] = useAtom(turingAddressAtom);

  // Process States
  const [isInProcess, setIsInProcess] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [batchTxDone, setBatchTxDone] = useState(false);

  // const [isAutocompounding, setIsAutocompounding] = useState<boolean>(false);
  // const [verifyStopCompounding, setVerifyStopCompounding] =
  //   useState<boolean>(false);

  const toast = useToast();
  const isAutocompounding = selectedTask?.status == 'RUNNING' ? true : false;
  const hasEvent = selectedEvent != undefined ? true : false;

  useEffect(() => {
    console.log('hasEvent', hasEvent);
    console.log('selected event', selectedEvent);
  }, [hasEvent]);

  const [token0, token1] = formatTokenSymbols(
    replaceTokenSymbols(farm?.asset.symbol)
  );
  const lpName = `${token0}-${token1}`;

  const APY = farm?.apr.base + farm?.apr.reward;
  const period = duration / frequency;
  const effectiveAPY = (((1 + APY / 100 / period) ** period - 1) * 100).toFixed(
    2
  );

  // ADD NEW TASK
  const [addXcmpTaskResult, addXcmpTask] = useMutation(AddXcmpTaskMutation);
  const addXcmpTaskHandler = async (
    taskId: string,
    userAddress: string,
    lpName: string,
    chain: string
  ) => {
    const variables = { taskId, userAddress, lpName, chain };
    console.log('Adding new task...');
    addXcmpTask(variables).then((result) => {
      console.log('addxcmptask result', result);
    });
  };

  const [createAutocompoundingResult, createAutocompoundingEvent] = useMutation(
    createAutocompoundEventMutation
  );
  const createAutocompoundingHandler = async (
    userAddress: string,
    chain: string,
    taskId: string,
    lp: TokenType,
    duration: number,
    frequency: number,
    timestamp: string,
    executionFee: number,
    xcmpFee: number,
    status: string,
    eventType: string,
    percentage: number
  ) => {
    const variables = {
      userAddress,
      chain,
      taskId,
      lp,
      duration,
      frequency,
      timestamp,
      executionFee,
      xcmpFee,
      status,
      eventType,
      percentage,
    };
    console.log('Creating a new autocompounding event');
    createAutocompoundingEvent(variables).then((result) => {
      console.log('createAutocompounding Result', result);
    });
  };

  useEffect(() => {
    // Fetching MGX and TUR balance of connect account on Mangata Chain
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

  // Fetch pool Just in time
  useEffect(() => {
    (async () => {
      if (totalFees !== 0) {
        console.log('fees already fetched');
        return;
      }
      console.log('Fetching fees...');
      try {
        const feesInTUR = await turTotalFees(
          pool,
          mangataHelper,
          turingHelper,
          account,
          token0,
          token1,
          duration,
          frequency
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
    })();
  }, [frequency, duration]);

  // Calculate LP balance
  useEffect(() => {
    (async () => {
      const lpBalance = await mangataHelper.mangata.getTokenBalance(
        pool.liquidityTokenId,
        account?.address
      );
      setLpBalance(lpBalance);
      const decimal = mangataHelper.getDecimalsBySymbol(`${token0}-${token1}`);
      const tokenAmount =
        parseFloat(BigInt(lpBalance.free).toString(10)) / 10 ** decimal +
        parseFloat(BigInt(lpBalance.reserved).toString(10)) / 10 ** decimal;
      console.log('tokenAmount total', tokenAmount);
      // setLpBalance(tokenAmount);
      setLpBalanceNum(tokenAmount);
    })();
  }, []);

  // Function which performs Autocompounding
  const handleCompounding = async () => {
    console.log('frequency', frequency);
    console.log('duration', duration);
    console.log('percentage', percentage);

    setIsInProcess(true);

    let mangataTransactions = [];
    const { liquidityTokenId } = pool;
    // Defining Signer to make trxns
    const signer = account?.wallet?.signer;

    /*
    const lpBalance = await mangataHelper.mangata.getTokenBalance(
      pool.liquidityTokenId,
      account?.address
    ); // token0-token1

    console.log('lpBalance', lpBalance);
    */
    const decimal = mangataHelper.getDecimalsBySymbol(`${token0}-${token1}`);

    // tokenAmount is the amount of locked liquidity token which are to be activated
    let lockedTokenAmount =
      parseFloat(BigInt(lpBalance.free).toString(10)) / 10 ** decimal;

    // edge case: if some amount was activated and some was not
    if (lockedTokenAmount !== 0) {
      let activateLiquidityTxn = await mangataHelper.activateLiquidityV2(
        liquidityTokenId,
        lockedTokenAmount
      );
      mangataTransactions.push(activateLiquidityTxn);
    }

    // Now as liquidity is activated, tokenAmoumt is total amount of liquidity
    /*
    tokenAmount =
      parseFloat(BigInt(lpBalance.free).toString(10)) / 10 ** decimal +
      parseFloat(BigInt(lpBalance.reserved).toString(10)) / 10 ** decimal;
    setLpBalance(tokenAmount);
    */

    console.log(
      'tokenAmount',
      lpBalanceNum,
      'liquidityTokenId',
      liquidityTokenId
    );

    console.log(
      '\n2. Add a proxy on Mangata for paraId 2114, or skip this step if that exists ...'
    );

    const proxyAddress = mangataHelper.getProxyAccount(
      account?.address, // mangataAddress,
      turingHelper.config.paraId
    );
    console.log('proxyAddress', proxyAddress);

    const proxiesResponse = await mangataHelper.api.query.proxy.proxies(
      account?.address
    );
    const proxies = _.first(proxiesResponse.toJSON());

    const proxyType = 'AutoCompound';
    const matchCondition = { delegate: proxyAddress, proxyType };

    const proxyMatch = _.find(proxies, matchCondition);

    if (proxyMatch) {
      console.log(
        `Found proxy of ${account?.address} on Mangata, and will skip the addition ... `,
        proxyMatch
      );
    } else {
      if (_.isEmpty(proxies)) {
        console.log(`Proxy array of ${account?.address} is empty ...`);
      } else {
        console.log(
          'Proxy not found. Expected',
          matchCondition,
          'Actual',
          proxies
        );
      }

      console.log(
        `Adding a proxy for paraId ${turingHelper.config.paraId}. Proxy address: ${proxyAddress} ...`
      );
      const aptx = await mangataHelper.addProxyTx(proxyAddress, proxyType);
      // await aptx.signAndSend(account1.address, { signer: signer });
      mangataTransactions.push(aptx);

      // const addProxyTx = api.tx.proxy.addProxy(proxyAccount, proxyType, 0)
    }

    console.log('proxyAddress', proxyAddress);

    // Auto-compound
    console.log('\n4. Start to schedule an auto-compound call via XCM ...');
    const proxyExtrinsic = mangataHelper.api.tx.xyk.compoundRewards(
      liquidityTokenId,
      (1000 * percentage) / 100 // permille ie. 100% of rewards
    );
    const mangataProxyCall = await mangataHelper.createProxyCall(
      account?.address,
      proxyType,
      proxyExtrinsic
    );
    const encodedMangataProxyCall =
      mangataProxyCall.method.toHex(mangataProxyCall);
    const mangataProxyCallFees = await mangataProxyCall.paymentInfo(
      account?.address
    );

    console.log('encodedMangataProxyCall: ', encodedMangataProxyCall);
    console.log('mangataProxyCallFees: ', mangataProxyCallFees.toHuman());

    // Create Turing scheduleXcmpTask extrinsic
    console.log('\na) Create the call for scheduleXcmpTask ');

    const secondsInHour = 3600;
    const millisecondsInHour = 3600 * 1000;
    const currentTimestamp = moment().valueOf();
    const et =
      (currentTimestamp - (currentTimestamp % millisecondsInHour)) / 1000;
    const executionTime = et + secondsInHour * 24;
    const providedId = `xcmp_automation_test_${(Math.random() + 1)
      .toString(36)
      .substring(7)}`;
    setProvidedId(providedId);

    // frequency
    const executionTimes = [];
    console.log('duration', duration, 'freq', frequency);

    for (let index = frequency; index < duration; index += frequency) {
      console.log('idx', index);
      executionTimes.push(et + secondsInHour * 24 * index);
    }

    setExecutionTimes(executionTimes);
    setEncodedMangataProxyCall(encodedMangataProxyCall);
    setMangataProxyCallFees(mangataProxyCallFees);

    console.log('providedId', providedId);
    console.log('executionTimes', executionTimes);
    console.log('encodedMangataProxyCall', encodedMangataProxyCall);
    console.log(
      'parseInt(mangataProxyCallFees.weight.refTime, 10)',
      parseInt(mangataProxyCallFees.weight.refTime, 10)
    );

    const xcmpCall = await turingHelper.api.tx.automationTime.scheduleXcmpTask(
      providedId,
      // {
      //   Recurring: {
      //     frequency: secondsInHour * 24 * frequency,
      //     nextExecutionTime: executionTime,
      //   },
      // },
      { Fixed: { executionTimes: executionTimes } },
      mangataHelper.config.paraId,
      0,
      encodedMangataProxyCall,
      parseInt(mangataProxyCallFees.weight.refTime, 10)
    );
    console.log('xcmpCall: ', xcmpCall);

    // Query automationTime fee IN TUR
    console.log('\nb) Query automationTime fee details ');
    const { executionFee, xcmpFee } =
      await turingHelper.api.rpc.automationTime.queryFeeDetails(xcmpCall);
    console.log('executionFee', executionFee, 'xcmpFee', xcmpFee);

    const totalFees = executionFee.toNumber() + xcmpFee.toNumber();
    console.log('totalFees', totalFees);
    // TOTAL_FEES / 10^(DECIMAL OF TUR)

    console.log('automationFeeDetails: ', {
      executionFee: executionFee.toHuman(),
      xcmpFee: xcmpFee.toHuman(),
    });

    // Getting (free) TUR balance on Turing Network
    console.log('turingAddress', turingAddress);

    const turbal = await turingHelper.getBalance(turingAddress);
    let turfreebal = turbal?.toHuman()?.free;
    turfreebal = parseFloat(turfreebal);
    console.log(
      'turbal',
      turfreebal,
      'exefee',
      executionFee.toNumber(),
      'xcmfee',
      xcmpFee.toNumber()
    );

    setExecutionFee(executionFee.toNumber());
    setXcmpFee(xcmpFee.toNumber());

    if (gasChoice === 0) {
      // pay with MGX // MGR on Rococo
      const baTx = await mangataHelper.buyAssetTx(
        'MGR',
        'TUR',
        // 0.1,
        totalFees / 10 ** 10,
        10000000
      );
      // await baTx.signAndSend(account1.address, { signer: signer });
      // mangataTransactions.push(baTx);

      console.log('Before TUR Transfer', totalFees);
      const transferTurTx = await mangataHelper.transferTur(
        // 1 * 10 ** 10,
        totalFees,
        turingAddress
      );
      // Transfer to Turing network
      mangataTransactions.push(transferTurTx);
      // await transferTurTx.signAndSend(account1.address, { signer: signer });
    } else if (gasChoice === 1) {
      // pay with TUR
      if (turfreebal < totalFees) {
        console.log('Before TUR Transfer', totalFees);
        const transferTurTx = await mangataHelper.transferTur(
          // 1 * 10 ** 10,
          totalFees,
          turingAddress
        );
        // await transferTurTx.signAndSend(account1.address, { signer: signer });
        mangataTransactions.push(transferTurTx);
      }
    } else {
      console.log("gasChoice doesn't exist");
    }
    console.log(
      'gasChoice',
      gasChoice,
      'mangataTransactions',
      mangataTransactions
    );
    // return;
    // BUG: NEED TO REMOVE await
    // const mangataBatchTx = await mangataHelper.api.tx.utility.batchAll(
    //   mangataTransactions
    // );
    setIsSigning(true); // Batch Trxn happening
    const mangataBatchTx =
      mangataHelper.api.tx.utility.batchAll(mangataTransactions);
    await mangataBatchTx
      .signAndSend(
        account1.address,
        { signer: signer },
        async ({ status }: any) => {
          if (status.isInBlock) {
            console.log(
              `Batch Tx is in block with hash ${status.asInBlock.toHex()}`
            );
          } else if (status.isFinalized) {
            console.log(
              `Batch Tx finalized with hash ${status.asFinalized.toHex()}`
            );
            setIsInProcess(false); // Process will be done when ScheduleXCMP Txn is done
            setBatchTxDone(true);
          } else {
            setIsSigning(false); // Reaching here means the trxn is signed
            console.log(`Status of Batch Tx: ${status.type}`);
          }
        }
      )
      .catch((error: any) => {
        console.log('Error in Batch Tx:', error);
        setIsSuccess(false);
        setIsSigning(false);
        setIsInProcess(false);
        toast({
          position: 'top',
          duration: 3000,
          render: () => (
            <ToastWrapper title="Error in Batch Tx" status="error" />
          ),
        });
      });

    // Get a TaskId from Turing rpc
    const taskId = await turingHelper.api.rpc.automationTime.generateTaskId(
      turingAddress,
      providedId
    );
    console.log('TaskId:', taskId);
    setTaskId(taskId?.toHuman() ?? taskId);
  };

  const handleXcmpScheduling = async () => {
    setIsInProcess(true);

    const signer = account?.wallet?.signer;
    const { liquidityTokenId } = pool;

    const xcmpCall = await turingHelper.api.tx.automationTime.scheduleXcmpTask(
      providedId,
      // {
      //   Recurring: {
      //     frequency: secondsInHour * 24 * frequency,
      //     nextExecutionTime: executionTime,
      //   },
      // },
      { Fixed: { executionTimes: executionTimes } },
      mangataHelper.config.paraId,
      0,
      encodedMangataProxyCall,
      parseInt(mangataProxyCallFees.weight.refTime, 10)
    );
    console.log('xcmpCall: ', xcmpCall);

    // Send extrinsic
    setIsSigning(true);
    console.log('\nc) Sign and send scheduleXcmpTask call ...');
    await turingHelper.sendXcmExtrinsic(
      xcmpCall,
      account?.address,
      signer,
      taskId,
      setIsSigning,
      setIsInProcess,
      setIsSuccess,
      toast
    );

    console.log('\nWaiting 20 seconds before reading new chain states ...');
    await delay(20000); // This is not how delay works

    setIsInProcess(false);
    setIsSigning(false);

    // Account’s reserved LP token after auto-compound
    const newLiquidityBalance = await mangataHelper.mangata.getTokenBalance(
      liquidityTokenId,
      account?.address
    );
    console.log(
      `\nAfter auto-compound, reserved ${token0}-${token1} is: ${newLiquidityBalance.reserved.toString()} planck ...`
    );

    const liquidityBalance = await mangataHelper.mangata?.getTokenBalance(
      liquidityTokenId,
      mangataAddress
    );

    console.log(
      `${account?.name} has compounded ${newLiquidityBalance.reserved
        .sub(liquidityBalance.reserved)
        .toString()} planck more ${token0}-${token1} ...`
    );
    console.log('Task has been executed!');
    console.log('to cancel', taskId);

    // Adding Xcmp Task of the completed compounding
    addXcmpTaskHandler(taskId, turingAddress as string, lpName, 'ROCOCO');
    // Creating Autocompounding Event
    createAutocompoundingHandler(
      turingAddress as string,
      'ROCOCO',
      taskId,
      { symbol: lpName, amount: lpBalanceNum },
      duration,
      frequency,
      moment().toISOString(),
      executionFee,
      xcmpFee,
      'RUNNING',
      'CREATE',
      percentage
    );
  };

  // const [offsetHeight, setOffsetHeight] = useState(0);

  // const mainmodalRef = useRef<HTMLDivElement>(null);

  // const handleScrollEffect = (event: any) => {
  //   console.log('scrolling', event);
  // };

  // useEffect(() => {
  //   mainmodalRef.current?.addEventListener('scroll', handleScrollEffect);
  //   const offsetHeight = mainmodalRef.current?.offsetHeight;
  //   console.log('compound height', offsetHeight);
  //   setOffsetHeight(offsetHeight ?? 0);
  // }, []);

  return (
    <div
      className="w-full relative flex flex-col gap-y-10 mt-10 text-xl leading-[27px]"
      // ref={mainmodalRef}
    >
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
            label="Day"
            value={1}
            disabled={hasEvent && selectedEvent?.frequency !== 1}
          />
          <RadioButton
            changed={setFrequency}
            isSelected={frequency === 7}
            label="Week"
            value={7}
            disabled={hasEvent && selectedEvent?.frequency !== 7}
          />
          <RadioButton
            changed={setFrequency}
            isSelected={frequency === 30}
            label="Month"
            value={30}
            disabled={hasEvent && selectedEvent?.frequency !== 30}
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
            disabled={hasEvent && selectedEvent?.duration !== 7}
          />
          <RadioButton
            changed={setDuration}
            isSelected={duration === 30}
            label="1 Month"
            value={30}
            disabled={hasEvent && selectedEvent?.duration !== 30}
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
          {isTurpriceLoading && totalFees == 0 ? (
            <p className="text-[#B9B9B9]">Calculating fees...</p>
          ) : (
            <p className="text-[#B9B9B9]">
              Costs{' '}
              <span className="text-white">
                ${(totalFees * turprice).toFixed(2)}
              </span>{' '}
              <span className="text-white">({turprice?.toFixed(2)} TUR)</span>{' '}
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
              <span>
                {turBalance ?? 'loading...'} {gasChoice == 0 ? 'MGR' : 'TUR'}
              </span>
            )}
            {/* <span className="text-[#8A8A8A]">$1000</span> */}
          </div>
        </div>
      )}
      {/* STEPPER */}
      {isInProcess && (
        <ProcessStepper
          activeStep={isSuccess ? 3 : isSigning ? 2 : 1}
          steps={[
            { label: 'Confirm' },
            { label: 'Sign' },
            { label: 'Complete' },
          ]}
        />
      )}
      {/* BUTTONS */}
      {isAutocompounding || (!isInProcess && isSuccess) ? (
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
          {!batchTxDone ? (
            <Button
              text={
                isInProcess
                  ? 'Activating Liquidity & proxy setup...'
                  : lpBalanceNum == 0
                  ? 'No balance, Please add liquidity'
                  : 'Autocompound'
              }
              type="primary"
              disabled={isInProcess || lpBalanceNum == 0}
              onClick={() => {
                if (frequency === duration) {
                  setFrequency(frequency - 1);
                }
                handleCompounding();
              }}
            />
          ) : (
            <Button
              text={isInProcess ? 'Scheduling...' : 'Schedule Autocompounding'}
              type="primary"
              disabled={isInProcess || isSuccess}
              onClick={handleXcmpScheduling}
            />
          )}
          <Button
            text="Cancel"
            type="secondary"
            onClick={() => {
              setOpen(false);
            }}
            disabled={isInProcess}
          />
        </div>
      )}
      {isInProcess && (
        <div className="flex flex-row px-4 items-center justify-center text-base leading-[21.6px] bg-baseGray rounded-lg py-10 text-center">
          {!isSuccess && <Loader size="md" />}
          {isSigning && (
            <span className="ml-6">
              Please sign the transaction on{' '}
              {gasChoice == 0 ? 'Mangata' : 'Turing'} in your wallet.
            </span>
          )}
          {isSuccess && <p>Autocompound Setup Successful!</p>}
        </div>
      )}
      {/* <DownSignal /> */}
    </div>
  );
};

export default CompoundTab;
