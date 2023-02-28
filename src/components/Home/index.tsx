import { useEffect, useState } from 'react';
import _ from 'lodash';
import Header from '@components/Header';
import LiquidityToken from '@components/Library/LiquidityToken';
import { useAtom } from 'jotai';
import moment from 'moment';
import BN from 'bn.js';
import {
  delay,
  listenEvents,
  getDecimalBN,
  calculateTimeout,
  sendExtrinsic,
} from '@utils/xcm/common/utils';
import Account from '@utils/xcm/common/account';
import MangataHelper from '@utils/xcm/common/mangataHelper';
import TuringHelper from '@utils/xcm/common/turingHelper';
import {
  Rococo,
  RococoDev,
  MangataDev,
  MangataRococo,
  TuringDev,
  Turing,
  TuringStaging,
  Shibuya,
  Rocstar,
  Shiden,
} from '@utils/xcm/config';
import { accountAtom } from '@store/accountAtoms';
import { fetchFarms } from '@utils/api';
import {
  filterMGXFarms,
  formatTokenSymbols,
  replaceTokenSymbols,
} from '@utils/farmMethods';
import { FarmType } from '@utils/types';
import { walletsAtom } from '@store/walletAtoms';

const Home = () => {
  const [selectedToken, setSelectedToken] = useState('MGR-TUR');
  const [tokenAmount, setTokenAmount] = useState(0);
  const [frequency, setFrequency] = useState(0);
  const [farms, setFarms] = useState<FarmType[]>([]);
  // Atoms
  const [account] = useAtom(accountAtom);

  const onTokenSelectChange = (value: any) => {
    const selected = value.target.value;
    setSelectedToken(selected);
  };

  const handleTokenAmount = (value: any) => {
    const amount = value.target.value;
    setTokenAmount(amount);
  };

  const handleFrequency = (value: any) => {
    const freq = value.target.value;
    setFrequency(freq);
  };

  useEffect(() => {
    (async () => {
      try {
        const { farms } = await fetchFarms();
        const filteredFarms = filterMGXFarms(farms);
        setFarms(filteredFarms);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen w-full">
      <Header />
      <main>
        <div className="max-w-sm m-10">
          <label htmlFor="pool" className="block text-sm font-medium">
            Select a Liquidity Pool
          </label>
          <select
            id="pool"
            name="pool"
            className="mt-1 block w-full rounded-md border border-gray-300 text-black py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            onChange={onTokenSelectChange}
            placeholder="Select a Liquidity Pool"
            required
          >
            {farms.map((farm) => {
              const tokenName = formatTokenSymbols(
                replaceTokenSymbols(farm?.asset.symbol)
              );
              const tokenSymbol = `${tokenName[0]}-${tokenName[1]}`;
              return (
                <option value={tokenSymbol}>
                  <LiquidityToken
                    firstTokenSymbol={tokenName[0]}
                    secondTokenSymbol={tokenName[1]}
                  />
                </option>
              );
            })}
          </select>
          <label htmlFor="amount">Enter a token amount</label>
          <input
            type="number"
            onChange={handleTokenAmount}
            name="amount"
            id="amount"
            className="block w-full rounded-md border py-2 px-4 text-black border-gray-300 pr-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="0"
            required
          />
          <label htmlFor="amount">Frequency</label>
          <input
            type="number"
            onChange={handleFrequency}
            name="frequency"
            id="frequency"
            className="block w-full rounded-md border py-2 px-4 text-black border-gray-300 pr-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="0"
            required
          />
        </div>
        <button
          onClick={async () => {
            console.log('selectedToken', selectedToken);
            console.log('tokenAmount', tokenAmount);
            console.log('frequency', frequency);
            console.log('account', account);
            // account?.signer?
            const signer = account?.wallet?.signer;

            console.log('Initializing APIs of both chains ...');

            const turingHelper = new TuringHelper(TuringStaging);
            await turingHelper.initialize();

            const mangataHelper = new MangataHelper(MangataRococo);
            await mangataHelper.initialize();

            const turingChainName = turingHelper.config.key;
            const mangataChainName = mangataHelper.config.key;

            console.log(
              'turingHelper.config.assets',
              turingHelper.config.assets
            );
            console.log(
              'mangataHelper.config.assets',
              mangataHelper.config.assets
            );

            const turingNativeToken = _.first(turingHelper.config.assets);
            const mangataNativeToken = _.first(mangataHelper.config.assets);

            console.log(
              `\nTuring chain name: ${turingChainName}, native token: ${JSON.stringify(
                turingNativeToken
              )}`
            );
            console.log(
              `Mangata chain name: ${mangataChainName}, native token: ${JSON.stringify(
                mangataNativeToken
              )}\n`
            );

            console.log('1. Reading token and balance of account ...');

            const account1 = new Account({
              address: account?.address,
              meta: {
                name: account?.name,
              },
            });
            await account1.init([turingHelper, mangataHelper]);
            // account1.print()

            console.log('account1', account1);

            const mangataAddress =
              account1.getChainByName(mangataChainName)?.address;
            const turingAddress =
              account1.getChainByName(turingChainName)?.address;
            console.log('mangataAddress', mangataAddress);
            console.log('turingAddress', turingAddress);

            // const poolName = `${mgxToken.symbol}-${turToken.symbol}`
            const poolName = selectedToken;

            console.log('poolname', poolName);
            const token0 = poolName.split('-')[0];
            const token1 = poolName.split('-')[1];

            console.log(
              '\n2. Add a proxy on Mangata for paraId 2114, or skip this step if that exists ...'
            );

            const proxyAddress = mangataHelper.getProxyAccount(
              mangataAddress,
              turingHelper.config.paraId
            );
            const proxiesResponse = await mangataHelper.api.query.proxy.proxies(
              mangataAddress
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
              const aptx = mangataHelper.addProxyTx(proxyAddress, proxyType);
              await (
                await aptx
              ).signAndSend(account1.address, { signer: signer });
              // const addProxyTx = api.tx.proxy.addProxy(proxyAccount, proxyType, 0)
            }

            console.log('proxyAddress', proxyAddress);

            const pools = await mangataHelper.getPools({ isPromoted: true });

            console.log('pools', pools);

            const pool = _.find(pools, {
              firstTokenId: mangataHelper.getTokenIdBySymbol(token0),
              secondTokenId: mangataHelper.getTokenIdBySymbol(token1),
            });
            console.log(`Found a pool of ${poolName}`, pool);

            if (_.isUndefined(pool)) {
              throw new Error(
                `Couldn’t find a liquidity pool for ${poolName} ...`
              );
            }

            // Calculate rwards amount in pool
            const { liquidityTokenId } = pool;

            console.log(
              `Checking how much reward available in ${poolName} pool, tokenId: ${liquidityTokenId} ...`
            );

            // Issue: current we couldn’t read this rewards value correct by always getting 0 on the claimable rewards.
            // The result is different from that in src/mangata.js
            const rewardAmount = await mangataHelper.calculateRewardsAmount(
              mangataAddress,
              liquidityTokenId
            );
            console.log(`Claimable reward in ${poolName}: `, rewardAmount);

            const liquidityBalance =
              await mangataHelper.mangata.getTokenBalance(
                liquidityTokenId,
                mangataAddress
              );
            const poolNameDecimalBN = getDecimalBN(
              mangataHelper.getDecimalsBySymbol(poolName)
            );
            const numReserved = new BN(liquidityBalance.reserved).div(
              poolNameDecimalBN
            );

            console.log(
              `Before auto-compound, ${
                account?.name
              } reserved "${poolName}": ${numReserved.toString()} ...`
            );

            // autocompound
            console.log(
              '\n4. Start to schedule an auto-compound call via XCM ...'
            );
            const proxyExtrinsic = mangataHelper.api.tx.xyk.compoundRewards(
              liquidityTokenId,
              10
            );
            const mangataProxyCall = await mangataHelper.createProxyCall(
              mangataAddress,
              proxyType,
              proxyExtrinsic
            );
            const encodedMangataProxyCall =
              mangataProxyCall.method.toHex(mangataProxyCall);
            const mangataProxyCallFees = await mangataProxyCall.paymentInfo(
              mangataAddress
            );

            console.log('encodedMangataProxyCall: ', encodedMangataProxyCall);
            console.log(
              'mangataProxyCallFees: ',
              mangataProxyCallFees.toHuman()
            );

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
            const executionTime =
              (currentTimestamp - (currentTimestamp % millisecondsInHour)) /
                1000 +
              secondsInHour * 24;
            const providedId = `xcmp_automation_test_${(Math.random() + 1)
              .toString(36)
              .substring(7)}`;

            // frequency

            const xcmpCall =
              await turingHelper.api.tx.automationTime.scheduleXcmpTask(
                providedId,
                {
                  Recurring: {
                    frequency: secondsInHour * 24 * frequency,
                    nextExecutionTime: executionTime,
                  },
                },
                // { Fixed: { executionTimes: [0] } },
                mangataHelper.config.paraId,
                0,
                encodedMangataProxyCall,
                parseInt(mangataProxyCallFees.weight.refTime, 10)
              );
            // await (xcmpCall).signAndSend(account1.address, {signer:signer})
            console.log('xcmpCall: ', xcmpCall);

            // Query automationTime fee
            console.log('\nb) Query automationTime fee details ');
            const { executionFee, xcmpFee } =
              await turingHelper.api.rpc.automationTime.queryFeeDetails(
                xcmpCall
              );
            // const { executionFee, xcmpFee } = await turingHelper.queryFeeDetails(xcmpCall)
            console.log('executionFee', executionFee, 'xcmpFee', xcmpFee);

            const totalFees = executionFee.toNumber() + xcmpFee.toNumber();
            console.log('totalFees', totalFees);

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
              // return
              const transferTurTx = mangataHelper.transferTur(
                totalFees,
                turingAddress
              );
              await (
                await transferTurTx
              ).signAndSend(account1.address, { signer: signer });
            }
            // return

            // Get a TaskId from Turing rpc
            const taskId =
              await turingHelper.api.rpc.automationTime.generateTaskId(
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

            // Listen XCM events on Mangata side
            console.log(
              `\n5. Keep Listening XCM events on ${mangataChainName} until ${moment(
                timestampNextHour * 1000
              ).format(
                'YYYY-MM-DD HH:mm:ss'
              )}(${timestampNextHour}) to verify that the task(taskId: ${taskId}, providerId: ${providedId}) will be successfully executed ...`
            );
            await listenEvents(mangataHelper.api, 'proxy', 'ProxyExecuted');

            const nextHourExecutionTimeout =
              calculateTimeout(timestampNextHour);
            const isTaskExecuted = await listenEvents(
              mangataHelper.api,
              'proxy',
              'ProxyExecuted',
              nextHourExecutionTimeout
            );
            if (!isTaskExecuted) {
              console.log('Timeout! Task was not executed.');
              return;
            }

            console.log('Task has been executed!');
            // // autocompound
            // console.log(
            //   '\n4. Start to schedule an auto-compound call via XCM ...'
            // )
            // const proxyExtrinsic = mangataHelper.api.tx.xyk.compoundRewards(
            //   liquidityTokenId,
            //   100
            // )
            // const mangataProxyCall = await mangataHelper.createProxyCall(
            //   mangataAddress,
            //   proxyType,
            //   proxyExtrinsic
            // )
            // const encodedMangataProxyCall =
            //   mangataProxyCall.method.toHex(mangataProxyCall)
            // const mangataProxyCallFees = await mangataProxyCall.paymentInfo(
            //   mangataAddress
            // )

            // console.log('encodedMangataProxyCall: ', encodedMangataProxyCall)
            // console.log(
            //   'mangataProxyCallFees: ',
            //   mangataProxyCallFees.toHuman()
            // )

            // // Create Turing scheduleXcmpTask extrinsic
            // console.log('\na) Create the call for scheduleXcmpTask ')
            // const providedId = `xcmp_automation_test_${(Math.random() + 1)
            //   .toString(36)
            //   .substring(7)}`

            // const secPerHour = 3600
            // const msPerHour = 3600 * 1000
            // const currentTimestamp = moment().valueOf()
            // const timestampNextHour =
            //   (currentTimestamp - (currentTimestamp % msPerHour)) / 1000 +
            //   secPerHour
            // const timestampTwoHoursLater =
            //   (currentTimestamp - (currentTimestamp % msPerHour)) / 1000 +
            //   secPerHour * 2

            // // call from proxy
            // const xcmpCall =
            //   await turingHelper.api.tx.automationTime.scheduleXcmpTask(
            //     providedId,
            //     {
            //       Fixed: {
            //         executionTimes: [
            //           timestampNextHour,
            //           timestampTwoHoursLater,
            //         ],
            //       },
            //     },
            //     mangataHelper.config.paraId,
            //     0,
            //     encodedMangataProxyCall,
            //     parseInt(mangataProxyCallFees.weight.refTime, 10)
            //   )
            // // await (xcmpCall).signAndSend(account1.address, {signer:signer})
            // console.log('xcmpCall: ', xcmpCall)

            // // Query automationTime fee
            // console.log('\nb) Query automationTime fee details ')
            // const { executionFee, xcmpFee } =
            //   await turingHelper.api.rpc.automationTime.queryFeeDetails(
            //     xcmpCall
            //   )
            // console.log('automationFeeDetails: ', {
            //   executionFee: executionFee.toHuman(),
            //   xcmpFee: xcmpFee.toHuman(),
            // })

            // // Get a TaskId from Turing rpc
            // const taskId =
            //   await turingHelper.api.rpc.automationTime.generateTaskId(
            //     turingAddress,
            //     providedId
            //   )
            // console.log('TaskId:', taskId.toHuman())

            // // Send extrinsic
            // console.log('\nc) Sign and send scheduleXcmpTask call ...')
            // await turingHelper.sendXcmExtrinsic(
            //   xcmpCall,
            //   account.address,
            //   signer,
            //   taskId
            // )

            // // Listen XCM events on Mangata side
            // console.log(
            //   `\n5. Keep Listening XCM events on ${mangataChainName} until ${moment(
            //     timestampNextHour * 1000
            //   ).format(
            //     'YYYY-MM-DD HH:mm:ss'
            //   )}(${timestampNextHour}) to verify that the task(taskId: ${taskId}, providerId: ${providedId}) will be successfully executed ...`
            // )
            // await listenEvents(mangataHelper.api, 'proxy', 'ProxyExecuted')

            // const nextHourExecutionTimeout =
            //   calculateTimeout(timestampNextHour)
            // const isTaskExecuted = await listenEvents(
            //   mangataHelper.api,
            //   'proxy',
            //   'ProxyExecuted',
            //   nextHourExecutionTimeout
            // )
            // if (!isTaskExecuted) {
            //   console.log('Timeout! Task was not executed.')
            //   return
            // }

            // console.log('Task has been executed!')

            console.log(
              '\nWaiting 20 seconds before reading new chain states ...'
            );
            await delay(20000);

            // Account’s reserved LP token after auto-compound
            const newLiquidityBalance =
              await mangataHelper.mangata.getTokenBalance(
                liquidityTokenId,
                mangataAddress
              );
            console.log(
              `\nAfter auto-compound, reserved ${poolName} is: ${newLiquidityBalance.reserved.toString()} planck ...`
            );

            console.log(
              `${account?.name} has compounded ${newLiquidityBalance.reserved
                .sub(liquidityBalance.reserved)
                .toString()} planck more ${poolName} ...`
            );

            // const { signature } = await signer.signRaw({
            //   type: 'payload',
            //   data: 'This is a test call.',
            //   address: account?.address,
            // })

            // const addProxyTx = mangataHelper.addProxy()

            // console.log("signature", signature)
          }}
          className="bg-blue-500 hover:bg-blue-600 rounded-md px-4 py-2 ml-10"
        >
          submit
        </button>
      </main>
    </div>
  );
};

export default Home;
