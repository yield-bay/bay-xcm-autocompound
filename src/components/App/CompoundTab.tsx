import { FC, useState } from 'react';
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

// Utils
import { MangataRococo, TuringStaging } from '@utils/xcm/config';
import { BN } from 'bn.js';
import { delay, getDecimalBN } from '@utils/xcm/common/utils';
import Account from '@utils/xcm/common/account';
import MangataHelper from '@utils/xcm/common/mangataHelper';
import TuringHelper from '@utils/xcm/common/turingHelper';
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
  const [percentage, setPercentage] = useState<number>(10); // default 10%

  const [balance, setBalance] = useState<number>(0);

  const [mangataAddress] = useAtom(mangataAddressAtom);
  const [turingAddress] = useAtom(turingAddressAtom);

  const [token0, token1] = formatTokenSymbols(
    replaceTokenSymbols(farm?.asset.symbol)
  );

  const APY = farm?.apr.base + farm?.apr.reward;
  const period = duration / frequency;
  const effectiveAPY = (((1 + APY / 100 / period) ** period - 1) * 100).toFixed(
    2
  );

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

    // TODO: COMMENTED THIS --- NEED TO CHECK
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

    console.log('automationFeeDetails: ', {
      executionFee: executionFee.toHuman(),
      xcmpFee: xcmpFee.toHuman(),
    });
    console.log('turingAddress', turingAddress);

    const turbal = await turingHelper.getBalance(turingAddress);
    const turfreebal = turbal?.toHuman()?.free;
    console.log('turbal', turfreebal);

    if (turfreebal < totalFees) {
      const diff = totalFees - turfreebal;
      console.log('diff', diff);
      // TODO: buy TUR using MGX on mangata condition

      const turBalMangata = await mangataHelper.getBalance(
        account?.address,
        'TUR'
      );
      console.log(
        'turBalMangata.free.toNumber()',
        turBalMangata.free.toNumber()
      );

      if (turBalMangata.free.toNumber() < diff) {
        const baTx = await mangataHelper.buyAssetTx(
          'MGR',
          'TUR',
          totalFees,
          '100000000000000000000'
        );
        // await baTx.signAndSend(account1.address, { signer: signer })
        mangataTransactions.push(baTx);
      }

      // return
      const transferTurTx = await mangataHelper.transferTur(
        totalFees,
        turingAddress
      );
      // await transferTurTx.signAndSend(account1.address, { signer: signer });
      mangataTransactions.push(transferTurTx);
    }
    // return

    const mangataBatchTx = await mangataHelper.api.tx.utility.batchAll(
      mangataTransactions
    );
    await mangataBatchTx.signAndSend(account1.address, { signer: signer });

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
      `\nAfter auto-compound, reserved ${poolName} is: ${newLiquidityBalance.reserved.toString()} planck ...`
    );

    console.log(
      `${account?.name} has compounded ${newLiquidityBalance.reserved
        .sub(liquidityBalance.reserved)
        .toString()} planck more ${poolName} ...`
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
    await bltx.signAndSend(account1?.address, { signer: signer });
  };

  return (
    <div className="w-full flex flex-col gap-y-10 mt-10 text-xl leading-[27px]">
      <div>
        <p className="inline-flex items-center mb-8">
          Frequency
          <Tooltip content={<span>Frequency of auto-compounding</span>}>
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
          <Tooltip content={<span>Duration of auto-compounding</span>}>
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
          <Tooltip
            content={<span>Percentage of liquidity to auto-compound</span>}
          >
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
            isSelected={percentage === 35}
            label="35%"
            value={35}
          />
          <RadioButton
            changed={setPercentage}
            isSelected={percentage === 45}
            label="45%"
            value={45}
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
          <p className="text-2xl">{effectiveAPY}%</p>
        </div>
      </div>
      <p className="text-base leading-[21.6px] font-medium text-center text-[#B9B9B9]">
        Costs <span className="text-white">$45</span> including Gas Fees + 0.5%
        Comission
      </p>
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
    </div>
  );
};

export default CompoundTab;
