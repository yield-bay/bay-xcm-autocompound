import { WalletAccount } from '@talismn/connect-wallets';
import moment from 'moment';
import MangataHelper from './xcm/common/mangataHelper';
import TuringHelper from './xcm/common/turingHelper';

export const turTotalFees = async (
  pool: any,
  mangataHelper: MangataHelper,
  turingHelper: TuringHelper,
  account: WalletAccount | null,
  duration: number,
  frequency: number,
  percentage: number
) => {
  if (account == null) return;
  const { liquidityTokenId } = pool;
  const proxyType = 'AutoCompound';

  const proxyExtrinsic = mangataHelper?.api?.tx.xyk.compoundRewards(
    liquidityTokenId,
    (1000 * percentage) / 100
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

  // Create Turing scheduleXcmpTask extrinsic
  console.log('\na) Create the call for scheduleXcmpTask ');

  const secondsInHour = 3600;
  const millisecondsInHour = 3600 * 1000;
  const currentTimestamp = moment().valueOf();
  const et =
    (currentTimestamp - (currentTimestamp % millisecondsInHour)) / 1000;

  const providedId = `xcmp_automation_test_${(Math.random() + 1)
    .toString(36)
    .substring(7)}`;

  // frequency
  const executionTimes = [];
  for (let index = frequency; index < duration; index += frequency) {
    executionTimes.push(et + secondsInHour * 24 * index);
  }

  console.log('executionTimes', executionTimes);
  

  const xcmpCall = await turingHelper?.api?.tx.automationTime.scheduleXcmpTask(
    providedId,
    { Fixed: { executionTimes: executionTimes } },
    mangataHelper.config.paraId,
    0,
    { V1: { parents: 1, interior: { X1: { Parachain: mangataHelper.config.paraId } } } },
    encodedMangataProxyCall,
    parseInt(mangataProxyCallFees.weight.refTime, 10)
  );

  // Query automationTime fee IN TUR
  console.log('\nb) Query automationTime fee details ');
  // console.log('qfds', await turingHelper?.api?.rpc?.automationTime.queryFeeDetails(xcmpCall));
  const { executionFee, xcmpFee } =
    await turingHelper?.api?.rpc?.automationTime.queryFeeDetails(xcmpCall);
  console.log('times', executionTimes.length, 'executionFee', executionFee.toNumber() / 10 ** 10, 'xcmpFee', xcmpFee.toNumber() / 10 ** 10);

  const totalFees =
    executionFee.toNumber() + xcmpFee.toNumber();
  console.log('totalFees iss', totalFees / 10 ** 10);
  return totalFees / 10 ** 10;
};
