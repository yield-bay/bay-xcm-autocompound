import { FC, useState, useEffect } from 'react';
import { TabProps } from '@utils/types';
import { useAtom } from 'jotai';
import {
  account1Atom,
  mainModalOpenAtom,
  mangataHelperAtom,
  turingHelperAtom,
  turingAddressAtom,
  mangataAddressAtom,
} from '@store/commonAtoms';
import Tooltip from '@components/Library/Tooltip';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import RadioButton from '@components/Library/RadioButton';
import Button from '@components/Library/Button';
import _ from 'lodash';
import moment from 'moment';
import CountUp from 'react-countup';

// Utils
import { BN } from 'bn.js';
import { delay, getDecimalBN } from '@utils/xcm/common/utils';
import { accountAtom } from '@store/accountAtoms';
import { formatTokenSymbols, replaceTokenSymbols } from '@utils/farmMethods';

const CompoundTab: FC<TabProps> = ({ farm, pool }) => {
  const [, setOpen] = useAtom(mainModalOpenAtom);
  const [account] = useAtom(accountAtom);
  const [account1] = useAtom(account1Atom);
  const [mangataHelper] = useAtom(mangataHelperAtom);
  const [turingHelper] = useAtom(turingHelperAtom);
  // We already have current account passed as a param

  const [frequency, setFrequency] = useState<number>(1); // default day
  const [duration, setDuration] = useState<number>(7); // default week
  const [gasChoice, setGasChoice] = useState<number>(0); // default 0 == "MGX" / 1 == "TUR"

  const [balance, setBalance] = useState<number>(0);
  const [gasFees, setGasFees] = useState<number>(0);

  const [mangataAddress] = useAtom(mangataAddressAtom);
  const [turingAddress] = useAtom(turingAddressAtom);

  const [isAutocompounding, setIsAutocompounding] = useState<boolean>(false);
  const [verifyStopCompounding, setVerifyStopCompounding] =
    useState<boolean>(false);

  const [token0, token1] = formatTokenSymbols(
    replaceTokenSymbols(farm?.asset.symbol)
  );

  const APY = farm?.apr.base + farm?.apr.reward;
  const period = duration / frequency;
  const effectiveAPY = (((1 + APY / 100 / period) ** period - 1) * 100).toFixed(
    2
  );

  // TODO: This useEffect shound check if autocompounding is active in the selected pool and set the state accordingly
  // useEffect(() => {
  //   setIsAutocompounding(true);
  // }, []);

  // Function which performs Autocompounding
  const handleCompounding = async () => {
    let mangataTransactions = [];
    const { liquidityTokenId } = pool;

    // Defining Signer to make trxns
    const signer = account?.wallet?.signer;

    // Address
    // const mangataAddress = account1.getChainByName(mangataChainName)?.address;
    // const turingAddress = account1.getChainByName(turingChainName)?.address;
    // console.log('mangataAddress', mangataAddress);
    // console.log('turingAddress', turingAddress);

    console.log('acc address', account?.address);

    const mgxTurBal = await mangataHelper.mangata.getTokenBalance(
      pool.liquidityTokenId,
      account?.address
    ); //mgx-tur

    console.log('mgxTurBal', mgxTurBal);
    const decimal = mangataHelper.getDecimalsBySymbol(`${token0}-${token1}`);
    console.log('decimal', decimal);
    const tokenAmount = BigInt(mgxTurBal.reserved).toString(10) / 10 ** decimal;
    setBalance(tokenAmount);

    let activateLiquidityTxn = await mangataHelper.activateLiquidityV2(
      liquidityTokenId,
      tokenAmount
    );
    mangataTransactions.push(activateLiquidityTxn);
    // activateLiquidityTxn.signAndSend(account1.address, { signer: signer });

    console.log(
      '\n2. Add a proxy on Mangata for paraId 2114, or skip this step if that exists ...'
    );

    const proxyAddress = mangataHelper.getProxyAccount(
      account?.address, // mangataAddress,
      turingHelper.config.paraId
    );
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
      10
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
    // const providedId = `xcmp_automation_test_${(Math.random() + 1).toString(36).substring(7)}`

    // const secPerHour = 3600
    // const msPerHour = 3600 * 1000
    // const currentTimestamp = moment().valueOf()
    // const timestampNextHour = (currentTimestamp - (currentTimestamp % msPerHour)) / 1000 + secPerHour
    // const timestampTwoHoursLater = (currentTimestamp - (currentTimestamp % msPerHour)) / 1000 + (secPerHour * 2)

    // call from proxy
    // const xcmpCall = await turingHelper.api.tx.automationTime.scheduleXcmpTask(
    //   providedId,
    //   { Fixed: { executionTimes: [timestampNextHour, timestampTwoHoursLater] } },
    //   mangataHelper.config.paraId,
    //   0,
    //   encodedMangataProxyCall,
    //   parseInt(mangataProxyCallFees.weight.refTime, 10),
    // )
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
    setGasFees(totalFees / 10 ** 10);

    console.log('automationFeeDetails: ', {
      executionFee: executionFee.toHuman(),
      xcmpFee: xcmpFee.toHuman(),
    });
    console.log('turingAddress', turingAddress);

    const turbal = await turingHelper.getBalance(turingAddress);
    const turfreebal = turbal?.toHuman()?.free;
    console.log('turbal', turfreebal);
    // return;

    /* Logic for managing the payment of fees
        if paywithmgx:
          mangatahelper.buyassettx('mgr','tur',...)//as written in current code (means buy tur with mgx on mangata network)
          mangatahelper.transfertur()//to turing network

        else if paywithtur:
          if turfreebal<totalfees:
            turbalmangata=mangatahelper.getbalance(acc.addr, 'tur')
            mangatahelper.transfertur()//to turing network
    */

    if (gasChoice === 0) {
      // pay with MGX
      const baTx = await mangataHelper.buyAssetTx(
        'MGR',
        'TUR',
        totalFees,
        '100000000000000000000'
      );
      mangataTransactions.push(baTx);

      console.log('Before TUR Transfer', totalFees);
      const transferTurTx = await mangataHelper.transferTur(
        totalFees,
        turingAddress
      );
      // Transfer to Turing network
      mangataTransactions.push(transferTurTx);
    } else if (gasChoice === 1) {
      // pay with TUR
      if (turfreebal < totalFees) {
        console.log('Before TUR Transfer', totalFees);
        const transferTurTx = await mangataHelper.transferTur(
          totalFees,
          turingAddress
        );
        mangataTransactions.push(transferTurTx);
      }
    } else {
      console.log("gasChoice doesn't exist");
    }

    const mangataBatchTx = await mangataHelper.api.tx.utility.batchAll(
      mangataTransactions
    );
    await mangataBatchTx
      .signAndSend(
        account1.address,
        { signer: signer },
        async ({ status }: any) => {
          if (status.isInBlock) {
            console.log(`Successful with hash ${status.asInBlock.toHex()}`);
            // unsub();
            // resolve();
          } else {
            console.log(`Status: ${status.type}`);
          }
        }
      )
      .catch((error: any) => {
        console.log('Error in Batch Transaction: ', error);
      });
    console.log('BATCH CALL DONE!');

    // Get a TaskId from Turing rpc
    const taskId = await turingHelper.api.rpc.automationTime.generateTaskId(
      turingAddress,
      providedId
    );
    console.log('TaskId:', taskId.toHuman());

    // Send extrinsic
    console.log('\nc) Sign and send scheduleXcmpTask call ...');
    await turingHelper.sendXcmExtrinsic(
      xcmpCall,
      account?.address,
      signer,
      taskId
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

    console.log(
      `${account?.name} has compounded ${newLiquidityBalance.reserved
        .sub(liquidityBalance.reserved)
        .toString()} planck more ${token0}-${token1} ...`
    );

    // remove liquidity
    // 1. turingHelper-> canceltask
    // 2. mangataHelper -> burnLiquidity

    console.log('Task has been executed!');
    console.log('to cancel', taskId, taskId.toHuman());

    const cancelTx = await turingHelper.api.tx.automationTime.cancelTask(
      taskId
    );
    await turingHelper.sendXcmExtrinsic(
      cancelTx,
      account?.address,
      signer,
      taskId
    );

    const bltx = await mangataHelper.burnLiquidityTx(
      pool.firstTokenId,
      pool.secondTokenId,
      newLiquidityBalance.reserved
    );
    await bltx
      .signAndSend(
        account1?.address,
        { signer: signer },
        async ({ status }: any) => {
          if (status.isInBlock) {
            console.log(
              `Burn Liquidity Successfully for ${pool.firstTokenId} & ${
                pool.secondTokenId
              } with hash ${status.asInBlock.toHex()}`
            );
            // unsub();
            // resolve();
          } else {
            console.log(`Status: ${status.type}`);
          }
        }
      )
      .catch((e: any) => {
        console.log('Error in burnLiquidityTx', e);
      });
  };

  return verifyStopCompounding ? (
    <div className="w-full flex flex-col gap-y-12 mt-10">
      <p className="text-base leading-[21.6px] text-[#B9B9B9] text-center w-full px-24">
        Are you sure you want to remove of stop Autocompounding?
      </p>
      <div className="inline-flex gap-x-2 w-full">
        <Button type="warning" text="Stop Autocompounding" className="w-3/5" />
        <Button
          type="secondary"
          text="Go Back"
          className="w-2/5"
          onClick={() => {
            setVerifyStopCompounding(false);
          }}
        />
      </div>
    </div>
  ) : (
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
        <p className="text-[#B9B9B9]">
          Costs <span className="text-white">{gasFees.toFixed(2)} TUR</span>{' '}
          including Gas Fees + 0.5% Comission
        </p>
        <div className="inline-flex items-center gap-x-10">
          <RadioButton
            changed={setGasChoice}
            isSelected={gasChoice == 0}
            label="Pay with MGX"
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
      </div>
      {isAutocompounding ? (
        <div className="flex flex-col gap-y-2">
          <Button text="Save Changes" type="disabled" onClick={() => {}} />
          <Button
            text="Stop Autocompounding"
            type="warning"
            onClick={() => {
              setVerifyStopCompounding(true);
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
    </div>
  );
};

export default CompoundTab;
