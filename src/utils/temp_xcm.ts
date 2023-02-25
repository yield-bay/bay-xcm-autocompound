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
  address: '5DkJNsxKSPtgeXHpEZVuDpTLDuHpNwemQHuUUsQpoSUDLv1z',
  meta: {
    name: 'abc',
  },
});
await account1.init([turingHelper, mangataHelper]);
// account1.print();

console.log('account1', account1);

const mangataAddress =
  account1.getChainByName(mangataChainName)?.address;
const turingAddress =
  account1.getChainByName(turingChainName)?.address;
console.log('mangataAddress', mangataAddress);
console.log('turingAddress', turingAddress);

const mgxToken = account1.getAssetByChainAndSymbol(
  mangataChainName,
  mangataNativeToken.symbol
);
const turToken = account1.getAssetByChainAndSymbol(
  mangataChainName,
  turingNativeToken.symbol
);
const poolName = `${mgxToken.symbol}-${turToken.symbol}`;

console.log('poolname', poolName);

console.log(
  '\n2. Add a proxy on Mangata for paraId 2114, or skip this step if that exists ...'
);

const proxyAddress = mangataHelper.getProxyAccount(
  mangataAddress,
  turingHelper.config.paraId
);
const proxiesResponse =
  await mangataHelper.api.query.proxy.proxies(mangataAddress);
const proxies = _.first(proxiesResponse.toJSON());

const proxyType = 'AutoCompound';
const matchCondition = { delegate: proxyAddress, proxyType };

const proxyMatch = _.find(proxies, matchCondition);

if (proxyMatch) {
  console.log(
    `Found proxy of ${account.address} on Mangata, and will skip the addition ... `,
    proxyMatch
  );
} else {
  if (_.isEmpty(proxies)) {
    console.log(`Proxy array of ${account.address} is empty ...`);
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
  firstTokenId: mangataHelper.getTokenIdBySymbol(mgxToken.symbol),
  secondTokenId: mangataHelper.getTokenIdBySymbol(
    turToken.symbol
  ),
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
    account.name
  } reserved "${poolName}": ${numReserved.toString()} ...`
);

// autocompound
console.log(
  '\n4. Start to schedule an auto-compound call via XCM ...'
);
const proxyExtrinsic = mangataHelper.api.tx.xyk.compoundRewards(
  liquidityTokenId,
  100
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
const providedId = `xcmp_automation_test_${(Math.random() + 1)
  .toString(36)
  .substring(7)}`;

const secPerHour = 3600;
const msPerHour = 3600 * 1000;
const currentTimestamp = moment().valueOf();
const timestampNextHour =
  (currentTimestamp - (currentTimestamp % msPerHour)) / 1000 +
  secPerHour;
const timestampTwoHoursLater =
  (currentTimestamp - (currentTimestamp % msPerHour)) / 1000 +
  secPerHour * 2;

// call from proxy
const xcmpCall =
  await turingHelper.api.tx.automationTime.scheduleXcmpTask(
    providedId,
    {
      Fixed: {
        executionTimes: [
          timestampNextHour,
          timestampTwoHoursLater,
        ],
      },
    },
    mangataHelper.config.paraId,
    0,
    encodedMangataProxyCall,
    parseInt(mangataProxyCallFees.weight.refTime, 10)
  );
// await (xcmpCall).signAndSend(account1.address, {signer:signer});
console.log('xcmpCall: ', xcmpCall);

// Query automationTime fee
console.log('\nb) Query automationTime fee details ');
const { executionFee, xcmpFee } =
  await turingHelper.api.rpc.automationTime.queryFeeDetails(
    xcmpCall
  );
console.log('automationFeeDetails: ', {
  executionFee: executionFee.toHuman(),
  xcmpFee: xcmpFee.toHuman(),
});

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
  account.address,
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
  `${account.name} has compounded ${newLiquidityBalance.reserved
    .sub(liquidityBalance.reserved)
    .toString()} planck more ${poolName} ...`
);

// const { signature } = await signer.signRaw({
//   type: 'payload',
//   data: 'This is a test call.',
//   address: account?.address,
// });

// const addProxyTx = mangataHelper.addProxy()

// console.log("signature", signature);