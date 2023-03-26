import { FC, useState, useEffect } from 'react';
import { TabProps } from '@utils/types';
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

const CompoundTab: FC<TabProps> = ({ farm, pool }) => {
  const [, setOpen] = useAtom(mainModalOpenAtom);
  const [account] = useAtom(accountAtom);
  const [account1] = useAtom(account1Atom);
  const [mangataHelper] = useAtom(mangataHelperAtom);
  const [turingHelper] = useAtom(turingHelperAtom);
  const [selectedTask] = useAtom(selectedTaskAtom);
  const [, setStopModalOpen] = useAtom(stopCompModalOpenAtom);

  const [frequency, setFrequency] = useState<number>(1); // default day
  const [duration, setDuration] = useState<number>(7); // default week
  const [percentage, setPercentage] = useState<number>(10); // default 10%

  const [gasChoice, setGasChoice] = useState<number>(0); // default 0 == "MGX" / 1 == "TUR"
  const [taskId, setTaskId] = useState<string>('');
  const [totalFees, setTotalFees] = useState<number>(0);

  const [lpBalance, setLpBalance] = useState<number>(0);
  const [mgxBalance, setMgxBalance] = useState<number>(0);
  const [turBalance, setTurBalance] = useState<number>(0);

  const [mangataAddress] = useAtom(mangataAddressAtom);
  const [turingAddress] = useAtom(turingAddressAtom);

  // Process States
  const [isInProcess, setIsInProcess] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // const [isAutocompounding, setIsAutocompounding] = useState<boolean>(false);
  // const [verifyStopCompounding, setVerifyStopCompounding] =
  //   useState<boolean>(false);

  const toast = useToast();
  const isAutocompounding = selectedTask?.status == 'RUNNING' ? true : false;

  const [token0, token1] = formatTokenSymbols(
    replaceTokenSymbols(farm?.asset.symbol)
  );

  const APY = farm?.apr.base + farm?.apr.reward;
  const period = duration / frequency;
  const effectiveAPY = (((1 + APY / 100 / period) ** period - 1) * 100).toFixed(
    2
  );

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

    const lpBalance = await mangataHelper.mangata.getTokenBalance(
      pool.liquidityTokenId,
      account?.address
    ); // token0-token1

    console.log('lpBalance', lpBalance);
    const decimal = mangataHelper.getDecimalsBySymbol(`${token0}-${token1}`);
    console.log('decimal', decimal);

    // tokenAmount is the amount of locked liquidity token which are to be activated
    let tokenAmount = BigInt(lpBalance.free).toString(10) / 10 ** decimal;
    // edge case: if some amount was activated and some was not
    if (tokenAmount !== 0) {
      // let freeTokenAmount = BigInt(lpBalance.free).toString(10) / 10 ** decimal;

      let activateLiquidityTxn = await mangataHelper.activateLiquidityV2(
        liquidityTokenId,
        tokenAmount
      );
      mangataTransactions.push(activateLiquidityTxn);
      // activateLiquidityTxn.signAndSend(account1.address, { signer: signer });
      // activateLiquidityTxn.signAndSend(account1.address, { signer: signer }, ({ status }: any) => {
      //   if (status.isInBlock) {
      //     console.log(`included in ${status.asInBlock}`);
      //     console.log(
      //       `al Tx is in block with hash ${status.asInBlock.toHex()}`
      //     );
      //   }else if (status.isFinalized) {
      //     console.log(
      //       `al Tx finalized with hash ${status.asFinalized.toHex()}`
      //     );
      //   } else {
      //     console.log(`Status of Batch Tx: ${status.type}`);
      //   }
      // });
    }
    tokenAmount =
      BigInt(lpBalance.free).toString(10) / 10 ** decimal +
      BigInt(lpBalance.reserved).toString(10) / 10 ** decimal;
    setLpBalance(tokenAmount);
    console.log(
      'tokenAmount',
      tokenAmount,
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

    // frequency
    const executionTimes = [];
    console.log('duration', duration, 'freq', frequency);

    for (let index = frequency; index < duration; index += frequency) {
      console.log('idx', index);

      executionTimes.push(et + secondsInHour * 24 * index);
    }

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
    // await (xcmpCall).signAndSend(account1.address, {signer:signer})
    console.log('xcmpCall: ', xcmpCall);

    // Query automationTime fee IN TUR
    console.log('\nb) Query automationTime fee details ');
    const { executionFee, xcmpFee } =
      await turingHelper.api.rpc.automationTime.queryFeeDetails(xcmpCall);
    // const { executionFee, xcmpFee } = await turingHelper.queryFeeDetails(xcmpCall)
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
    const turfreebal = turbal?.toHuman()?.free;
    console.log(
      'turbal',
      turfreebal,
      'exefee',
      executionFee.toNumber(),
      'xcmfee',
      xcmpFee.toNumber()
    );

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
    setIsSigning(true);
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
            setIsInProcess(false);
            setIsSigning(false);
            setIsSuccess(true);
          } else {
            console.log(`Status of Batch Tx: ${status.type}`);
          }
        }
      )
      .catch((error: any) => {
        console.log('Error in Batch Tx:', error);
        setIsSuccess(false);
        setIsSigning(false);
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
    console.log('TaskId:', taskId.toHuman());

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
    await delay(20000);

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
    console.log('to cancel', taskId, taskId.toHuman());
    setTaskId(taskId.toHuman());

    // TODO: Call a post request to update the current autocompounding task
    // @params taskId, userAddress, lpName, chain
  };

  // return verifyStopCompounding ? (
  //   <div className="w-full flex flex-col gap-y-12 mt-10">
  //     <p className="text-base leading-[21.6px] text-[#B9B9B9] text-center w-full px-24">
  //       Are you sure you want to remove of stop Autocompounding?
  //     </p>
  //     <div className="inline-flex gap-x-2 w-full">
  //       <Button type="warning" text="Stop Autocompounding" className="w-3/5" />
  //       <Button
  //         type="secondary"
  //         text="Go Back"
  //         className="w-2/5"
  //         onClick={() => {
  //           setVerifyStopCompounding(false);
  //         }}
  //       />
  //     </div>
  //   </div>
  // ) :
  return (
    <div className="w-full flex flex-col gap-y-10 mt-10 text-xl leading-[27px]">
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
          />
          <RadioButton
            changed={setFrequency}
            isSelected={frequency === 7}
            label="Week"
            value={7}
          />
          <RadioButton
            changed={setFrequency}
            isSelected={frequency === 30}
            label="Month"
            value={30}
          />
        </div>
      </div>
      <div>
        <p className="inline-flex items-center mb-8">
          Duration
          <Tooltip label="Duration of auto-compounding">
            <QuestionMarkCircleIcon className="h-5 w-5 opacity-50 ml-3" />
          </Tooltip>
        </p>
        <div className="flex flex-row gap-x-8">
          <RadioButton
            changed={setDuration}
            isSelected={duration === 7}
            label="1 Week"
            value={7}
          />
          <RadioButton
            changed={setDuration}
            isSelected={duration === 30}
            label="1 Month"
            value={30}
          />
        </div>
      </div>
      <div>
        <p className="inline-flex items-center mb-8">
          Percentage
          <Tooltip label="Percentage of Auto-compounding">
            <QuestionMarkCircleIcon className="h-5 w-5 opacity-50 ml-3" />
          </Tooltip>
        </p>
        <div className="flex flex-row gap-x-8">
          <RadioButton
            changed={setPercentage}
            isSelected={percentage === 10}
            label="10%"
            value={10}
          />
          <RadioButton
            changed={setPercentage}
            isSelected={percentage === 25}
            label="25%"
            value={25}
          />
          <RadioButton
            changed={setPercentage}
            isSelected={percentage === 50}
            label="50%"
            value={50}
          />
          <RadioButton
            changed={setPercentage}
            isSelected={percentage === 100}
            label="complete"
            value={100}
          />
        </div>
      </div>
      {/* Card box to show current and effective APY */}
      <div className="inline-flex justify-between w-full rounded-lg bg-[#1C1C1C] py-6 px-9">
        <div className="flex flex-col items-center gap-y-3">
          <p className="text-xl font-medium opacity-60">Current APY</p>
          <p className="text-2xl">{APY.toFixed(2)}%</p>
        </div>
        <div className="flex flex-col items-center gap-y-3">
          <p className="text-xl font-medium opacity-60">Effective APY</p>
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
      </div>
      <div className="flex flex-col gap-y-12 text-base leading-[21.6px] font-bold items-center">
        {isTurpriceLoading && totalFees == 0 ? (
          <p className="text-[#B9B9B9]">Calculating fees...</p>
        ) : (
          <p className="text-[#B9B9B9]">
            Costs{' '}
            <span className="text-white">
              ${(totalFees * turprice).toFixed(2)}{' '}
            </span>
            Gas Fees
          </p>
        )}
        <div className="inline-flex items-center gap-x-10">
          <RadioButton
            changed={setGasChoice}
            isSelected={gasChoice == 0}
            label="Pay with MGR"
            value={0}
            className={gasChoice == 0 ? '' : 'opacity-50'}
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
      {isAutocompounding ? (
        <div className="flex flex-col gap-y-2">
          <Button text="Save Changes" type="disabled" onClick={() => {}} />
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
            text="Autocompound"
            type="primary"
            onClick={handleCompounding}
          />
          <Button
            text="Cancel"
            type="secondary"
            onClick={() => {
              setOpen(false);
            }}
          />
        </div>
      )}
      {isInProcess && (
        <div className="flex flex-row px-4 items-center justify-center text-base leading-[21.6px] bg-baseGray rounded-lg py-10 text-center">
          {isSigning && !isSuccess && <Loader size="md" />}
          {isSigning && (
            <span className="ml-6">
              Please sign the transaction on{' '}
              {gasChoice == 0 ? 'Mangata' : 'Turing'} in your wallet.
            </span>
          )}
          {isSuccess && (
            <p>
              Autocompound Setup Successful!
              {/* View your hash{' '}
              <a href="#" className="underline underline-offset-4">
                here
              </a> */}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CompoundTab;
