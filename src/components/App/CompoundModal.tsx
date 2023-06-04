import { FC, useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import Button from '@components/Library/Button';
import Loader from '@components/Library/Loader';
import ModalWrapper from '@components/Library/ModalWrapper';
import Stepper from '@components/Library/Stepper';
import { delay } from '@utils/xcm/common/utils';
import {
  mainModalOpenAtom,
  selectedFarmAtom,
  mangataHelperAtom,
  mangataAddressAtom,
  turingAddressAtom,
  account1Atom,
  poolsAtom,
  compoundModalOpenAtom,
  compoundConfigAtom,
  turingHelperAtom,
  isInitialisedAtom,
  taskUpdatedAtom,
} from '@store/commonAtoms';
import { formatTokenSymbols, replaceTokenSymbols } from '@utils/farmMethods';
import moment from 'moment';
import { accountAtom } from '@store/accountAtoms';
import _ from 'lodash';
import { useToast } from '@chakra-ui/react';
import ToastWrapper from '@components/Library/ToastWrapper';
import { TokenType } from '@utils/types';
import {
  AddXcmpTaskMutation,
  createAutocompoundEventMutation,
} from '@utils/api';
import { useMutation } from 'urql';
import getTimestamp from '@utils/getTimestamp';
import { IS_PRODUCTION } from '@utils/constants';

const CompoundModal: FC = () => {
  const [, setOpenMainModal] = useAtom(mainModalOpenAtom);
  const [account] = useAtom(accountAtom);
  const [account1] = useAtom(account1Atom);
  const [isModalOpen, setIsModalOpen] = useAtom(compoundModalOpenAtom);
  const [farm] = useAtom(selectedFarmAtom);
  const [mangataHelper] = useAtom(mangataHelperAtom);
  const [mangataAddress] = useAtom(mangataAddressAtom);
  const [turingAddress] = useAtom(turingAddressAtom);
  const [pools] = useAtom(poolsAtom);
  const [config] = useAtom(compoundConfigAtom);
  const [turingHelper] = useAtom(turingHelperAtom);
  const [isInitialised] = useAtom(isInitialisedAtom);
  const [taskUpdated, setTaskUpdated] = useAtom(taskUpdatedAtom);

  const [pool, setPool] = useState<any>(null);
  const [taskId, setTaskId] = useState<any>('');
  const [executionFee, setExecutionFee] = useState<number>(0);
  const [xcmpFee, setXcmpFee] = useState<number>(0);
  const [mangataProxyCallFees, setMangataProxyCallFees] = useState<any>(null);
  const [encodedMangataProxyCall, setEncodedMangataProxyCall] =
    useState<any>(null);
  const [executionTimes, setExecutionTimes] = useState<any>(null);
  const [providedId, setProvidedId] = useState<string>();

  const toast = useToast();

  // Process states
  const [isInProcess, setIsInProcess] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [batchTxDone, setBatchTxDone] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFailed, setIsFailed] = useState(false);

  const [lpBalance, setLpBalance] = useState<any>();
  const [lpBalanceNum, setLpBalanceNum] = useState<number>(0);

  const [token0, token1] = formatTokenSymbols(
    IS_PRODUCTION
      ? farm?.asset.symbol ?? 'MGX-TUR LP'
      : replaceTokenSymbols(farm?.asset.symbol ?? 'MGR-TUR LP')
  );
  const lpName = `${token0}-${token1}`;

  const { frequency, duration, percentage, gasChoice } = config;

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
    try {
      addXcmpTask(variables).then((result) => {
        console.log('addxcmptask result', result);
      });
    } catch (error) {
      console.log('Error in addXcmpTask', error);
    }
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
    try {
      createAutocompoundingEvent(variables).then((result) => {
        console.log('createAutocompounding Result', result);
      });
    } catch (error) {
      console.log('Error while createCompounding call:', error);
    }
  };

  // Calculate LP balance
  useEffect(() => {
    // Resetting all states to default on open/close
    setIsInProcess(false);
    setIsSigning(false);
    setBatchTxDone(false);
    setIsSuccess(false);
    setIsFailed(false);

    if (!isInitialised) return;
    const pool = _.find(pools, {
      firstTokenId: mangataHelper.getTokenIdBySymbol(token0),
      secondTokenId: mangataHelper.getTokenIdBySymbol(token1),
    });
    console.log('pool:', pool);
    setPool(pool);

    const asyncFn = async () => {
      try {
        const lpBalance = await mangataHelper.mangata.getTokenBalance(
          pool?.liquidityTokenId,
          account?.address
        );
        setLpBalance(lpBalance);
        const decimal = mangataHelper.getDecimalsBySymbol(
          `${token0}-${token1}`
        );
        const tokenAmount =
          parseFloat(BigInt(lpBalance.free).toString(10)) / 10 ** decimal +
          parseFloat(BigInt(lpBalance.reserved).toString(10)) / 10 ** decimal;
        console.log('tokenAmount total', tokenAmount);
        setLpBalanceNum(tokenAmount);
      } catch (error) {
        console.log('Error while getting LP balance');
      }
    };
    asyncFn();
  }, [isModalOpen]);

  // Run the API calls when the isSuccess is updated and is true
  useEffect(() => {
    if (isSuccess) {
      console.log(
        'Calling addXcmpTaskHandler and createAutocompoundingHandler...'
      );

      // Updating compounding counter
      setTaskUpdated(taskUpdated + 1);

      // Adding Xcmp Task of the completed compounding
      addXcmpTaskHandler(
        taskId,
        turingAddress as string,
        lpName,
        IS_PRODUCTION ? 'KUSAMA' : 'ROCOCO'
      );

      // Creating Autocompounding Event
      createAutocompoundingHandler(
        turingAddress as string,
        IS_PRODUCTION ? 'KUSAMA' : 'ROCOCO',
        taskId,
        { symbol: lpName, amount: lpBalanceNum },
        duration,
        frequency,
        getTimestamp(),
        executionFee,
        xcmpFee,
        'RUNNING',
        'CREATE',
        percentage
      );
      console.log(
        'compounding task added in xcmpTasks and createAutocompounding'
      );
    }
  }, [isSuccess]);

  // Step 1: Step-up Proxy, Activate liquidity => Transfer TUR
  const handleCompounding = async () => {
    console.log('frequency', frequency);
    console.log('duration', duration);
    console.log('percentage', percentage);

    setIsInProcess(true);

    try {
      let mangataTransactions: any[] = [];

      const { liquidityTokenId } = pool;
      // Defining Signer to make trxns
      const signer = account?.wallet?.signer;

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
        mangataTransactions.push(aptx);
        // const addProxyTx = api.tx.proxy.addProxy(proxyAccount, proxyType, 0)
      }

      console.log('proxyAddress', proxyAddress);

      // Auto-compound
      console.log('\n4. Start to schedule an auto-compound call via XCM ...');
      const proxyExtrinsic = mangataHelper.api.tx.xyk.compoundRewards(
        liquidityTokenId,
        (1000000 * percentage) / 100 // permille ie. 100% of rewards
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
      let freq = frequency;
      if (frequency == 7 && duration == 7) {
        console.log('77');
        // setFrequency(6);
        freq = 6;
      }
      if (frequency == 30 && duration == 30) {
        console.log('3030');
        // setFrequency(29);
        freq = 29;
      }

      for (let index = freq; index < duration; index += freq) {
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

      const xcmpCall =
        await turingHelper.api.tx.automationTime.scheduleXcmpTask(
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
          {
            V1: {
              parents: 1,
              interior: { X1: { Parachain: mangataHelper.config.paraId } },
            },
          },
          encodedMangataProxyCall,
          parseInt(mangataProxyCallFees.weight.refTime, 10)
        );
      console.log('xcmpCall: ', xcmpCall);

      // Query automationTime fee IN TUR
      console.log('\nb) Query automationTime fee details ');
      const { executionFee, xcmpFee } =
        await turingHelper.api.rpc.automationTime.queryFeeDetails(xcmpCall);
      console.log(
        'executionFee',
        executionFee.toNumber(),
        'xcmpFee',
        xcmpFee.toNumber()
      );

      const totalFees = parseInt(
        (executionFee.toNumber() + xcmpFee.toNumber()).toString()
      );
      console.log('totalFees cmod', totalFees);
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
      console.log(
        'mangataHelper.api.events.system.ExtrinsicFailed',
        mangataHelper.api.events.system.ExtrinsicFailed
      );
      // return;
      // BUG: NEED TO REMOVE await
      // const mangataBatchTx = await mangataHelper.api.tx.utility.batchAll(
      //   mangataTransactions
      // );
      setIsSigning(true); // Batch Trxn happening
      if (mangataTransactions.length == 0) {
        setIsInProcess(false);
        setBatchTxDone(true);
      } else {
        const mangataBatchTx =
          mangataHelper.api.tx.utility.batchAll(mangataTransactions);
        await mangataBatchTx
          .signAndSend(
            account1?.address,
            // { signer: signer, nonce: -1 },
            { signer: signer },
            // (resp: any) => {
            //   console.log(`resp:: ${JSON.stringify(resp)}`);
            //   const { dispatchError } = resp;
            //   if (dispatchError) {
            //     if (dispatchError.isModule) {
            //       // for module errors, we have the section indexed, lookup
            //       const decoded = mangataHelper.api.registry.findMetaError(
            //         dispatchError.asModule
            //       );
            //       const { docs, name, section } = decoded;

            //       console.log(`${section}.${name}: ${docs.join(' ')}`);
            //     } else {
            //       // Other, CannotLookup, BadOrigin, no extra info
            //       console.log(dispatchError.toString());
            //     }
            //   }
            // }
            ({ status, events, dispatchError }: any) => {
              console.log('events', JSON.stringify(events));
              console.log('status', JSON.stringify(status));
              console.log('dispatchError', JSON.stringify(dispatchError));

              // if (dispatchError) {
              //   if (dispatchError.isModule) {
              //     // for module errors, we have the section indexed, lookup
              //     const decoded = mangataHelper.api.registry.findMetaError(
              //       dispatchError.asModule
              //     );
              //     const { docs, name, section } = decoded;

              //     console.log(`${section}.${name}: ${docs.join(' ')}`);
              //   } else {
              //     // Other, CannotLookup, BadOrigin, no extra info
              //     console.log(dispatchError.toString());
              //   }
              // }
              console.log(
                'mangataHelper.api.events.system.ExtrinsicFailed',
                mangataHelper.api.events.system.ExtrinsicFailed
              );
              events.forEach((e: any) => {
                console.log(
                  'ISSmangataHelper.api.events.system.ExtrinsicFailed',
                  mangataHelper.api.events.system.ExtrinsicFailed.is(e)
                );
                const {
                  phase,
                  event: { data, method, section },
                } = e;
                console.info(
                  'data',
                  data,
                  'method',
                  method,
                  'section',
                  section
                );

                if (
                  method === 'BatchInterrupted' ||
                  method === 'ExtrinsicFailed'
                ) {
                  console.log('failed is true');
                  // failed = true;
                }
              });
              if (status.isInBlock) {
                console.log(
                  `Batch Tx is in block with hash ${status.asInBlock.toHex()}`
                );
              } else if (status.isFinalized) {
                // if (status.isInBlock || status.isFinalized) {
                // const { bh } = status;
                (async () => {
                  const tranHash = status.asFinalized.toString();
                  console.log(
                    `Batch Tx finalized with hash ${tranHash}\n\nbefore delay\n`
                  );
                  await delay(20000);
                  console.log('after delay');

                  const block = await mangataHelper.api.rpc.chain.getBlock(
                    tranHash
                  );
                  console.log('block', block);
                  console.log('block', JSON.stringify(block));
                  const bhn = parseInt(block.block.header.number) + 1;
                  console.log('num', bhn);
                  const blockHash =
                    await mangataHelper.api.rpc.chain.getBlockHash(bhn);
                  console.log(`blockHash ${blockHash}`);
                  console.log('bhjs', JSON.stringify(blockHash) ?? 'nothing');
                  // const blockEvents =
                  //   await mangataHelper.api.query.system.events.at(tranHash);
                  const at = await mangataHelper.api.at(blockHash);
                  const blockEvents = await at.query.system.events();
                  console.log('blockEvents', blockEvents);
                  let allSuccess = true;
                  blockEvents.forEach((d: any) => {
                    const {
                      phase,
                      event: { data, method, section },
                    } = d;
                    console.info(
                      'data',
                      data,
                      'method',
                      method,
                      'section',
                      section
                    );
                    if (
                      method === 'BatchInterrupted' ||
                      method === 'ExtrinsicFailed'
                    ) {
                      console.log('failed is true');
                      // failed = true;
                      console.log('Error in Batch Tx:');
                      allSuccess = false;
                      setIsSuccess(false);
                      setIsSigning(false);
                      setIsInProcess(false);
                      toast({
                        position: 'top',
                        duration: 3000,
                        render: () => (
                          <ToastWrapper
                            title="Failed to transfer TUR"
                            status="error"
                          />
                        ),
                      });
                    }
                  });
                  if (allSuccess) {
                    console.log('allSuccess', allSuccess);
                    setIsInProcess(false); // Process will be done when ScheduleXCMP Txn is done
                    setBatchTxDone(true);
                  }
                })();
                // setIsInProcess(false); // Process will be done when ScheduleXCMP Txn is done
                // setBatchTxDone(true);
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
                <ToastWrapper title="Failed to transfer TUR" status="error" />
              ),
            });
          });
      }

      // Get a TaskId from Turing rpc
      const taskId = await turingHelper.api.rpc.automationTime.generateTaskId(
        turingAddress,
        providedId
      );
      console.log('TaskId:', taskId);
      setTaskId(taskId?.toHuman() ?? taskId);
    } catch (error) {
      let errorString = `${error}`;
      console.log('error while create compounding task:', errorString);
      toast({
        position: 'top',
        duration: 3000,
        render: () => <ToastWrapper title={errorString} status="error" />,
      });
      setIsInProcess(false);
      setIsSigning(false);
    }
  };

  // Step 2: Schedule XCMP Task
  const handleXcmpScheduling = async () => {
    setIsInProcess(true);
    const signer = account?.wallet?.signer;
    const { liquidityTokenId } = pool;

    try {
      const xcmpCall =
        await turingHelper.api.tx.automationTime.scheduleXcmpTask(
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
          {
            V1: {
              parents: 1,
              interior: { X1: { Parachain: mangataHelper.config.paraId } },
            },
          },
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
        setIsFailed,
        toast
      );

      // console.log('\nWaiting 20 seconds before reading new chain states ...');
      // await delay(20000); // This is not how delay works

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
    } catch (error) {
      let errorString = `${error}`;
      console.log('error while create compounding task:', errorString);
      toast({
        position: 'top',
        duration: 3000,
        render: () => <ToastWrapper title={errorString} status="error" />,
      });
      setIsInProcess(false);
      setIsSigning(false);
    }
  };

  return (
    <ModalWrapper
      open={isModalOpen || isInProcess || (batchTxDone && !isSuccess)}
      setOpen={
        isInProcess || (batchTxDone && !isSuccess) ? () => {} : setIsModalOpen
      }
    >
      {!isInProcess && !isSuccess && (
        <div className="flex flex-col gap-y-8">
          <div className="p-6 flex flex-col gap-y-8">
            <p className="text-center w-full">
              Setting up compounding for {lpBalanceNum.toFixed(2)} LP Tokens
            </p>
            <div className="inline-flex justify-between gap-x-8">
              <InfoLabel label="frequency" value={config.frequency} />
              <InfoLabel label="duration" value={config.duration} />
              <InfoLabel label="percentage" value={config.percentage} />
            </div>
          </div>
          <div className="inline-flex justify-between gap-x-2">
            <Button
              type="secondary"
              text="Go Back"
              className="w-1/2"
              disabled={batchTxDone} // Modal should be unclosable after batchTxn is done
              onClick={() => {
                setOpenMainModal(true);
                setIsModalOpen(false);
              }}
            />
            {!batchTxDone ? (
              <Button
                text="Proceed"
                type="primary"
                className="w-1/2 bg-primaryGreen"
                onClick={handleCompounding}
              />
            ) : (
              <Button
                text="Setup Compounding"
                type="primary"
                className="w-1/2 bg-primaryGreen"
                onClick={handleXcmpScheduling}
              />
            )}
          </div>
        </div>
      )}
      {isInProcess && (
        <div className="flex flex-row gap-x-6 py-14 items-center justify-center text-xl leading-[27px] bg-baseGray rounded-lg select-none">
          {!isSuccess && <Loader size="md" />}
          {isSigning ? (
            !batchTxDone ? (
              <span className="text-center max-w-[272px]">
                Please Sign the Transaction on Mangata in your wallet.
              </span>
            ) : (
              <span className="text-center max-w-[272px]">
                Please Sign the Transaction on Turing in your wallet.
              </span>
            )
          ) : (
            <div className="text-left max-w-[280px]">
              <p>Completing Transaction..</p>
              <p>This may take a few seconds</p>
            </div>
          )}
        </div>
      )}
      {isSuccess && (
        <div className="flex flex-col gap-y-8">
          <div className="py-14 text-center text-xl leading-[27px] bg-baseGray rounded-lg">
            <p>Transaction Complete!</p>
            <p>Autocompound setup successful.</p>
          </div>
          <div className="w-full text-[#C5C5C5] py-3 text-base leading-[21.6px] text-center rounded-lg bg-[#0C0C0C]">
            Autocompounding {lpBalanceNum.toFixed(3)} {token0}-{token1} LP
            tokens
          </div>
          <div className="inline-flex justify-between gap-x-8">
            <InfoLabel label="frequency" value={config.frequency} />
            <InfoLabel label="duration" value={config.duration} />
            <InfoLabel label="percentage" value={config.percentage} success />
          </div>
          <button
            className="w-full py-[13px] mt-16 text-base leading-[21.6px] rounded-lg border border-[#7D7D7D] hover:border-[#9d9d9d] transition duration-200"
            onClick={() => {
              setIsModalOpen(false);
              setTaskUpdated(taskUpdated + 1); // Refresh the task list on closing modal
            }}
          >
            Go to Home
          </button>
        </div>
      )}
      {!isSuccess && !batchTxDone ? (
        <Stepper
          activeStep={!isInProcess ? 0 : isSigning ? 1 : 2}
          steps={[
            { label: 'Confirm' },
            { label: IS_PRODUCTION ? 'MGX' : 'MGR' },
            { label: 'Complete' },
          ]}
        />
      ) : (
        !isSuccess && (
          <Stepper
            activeStep={!isInProcess ? 0 : isSigning ? 1 : 2}
            steps={[
              { label: 'Confirm' },
              { label: 'TUR' },
              { label: 'Complete' },
            ]}
          />
        )
      )}
    </ModalWrapper>
  );
};

const InfoLabel = ({
  label,
  value,
  success,
}: {
  label: string;
  value: number;
  success?: boolean;
}) => {
  const valueInText = (): string => {
    switch (label) {
      case 'frequency':
        return value == 1 ? 'Daily' : value == 7 ? 'Weekly' : 'Monthly';
      case 'duration':
        return value == 7 ? '1 Week' : value == 30 ? '1 Month' : '6 Months';
      case 'percentage':
        return `${value}%`;
      default:
        return value.toString();
    }
  };

  return (
    <div className="flex flex-col items-center gap-y-1">
      <p className="text-[#969595] max-w-[140px] text-center">
        {success && label == 'percentage'
          ? 'Reinvestment Percentage'
          : label.slice(0, 1).toUpperCase() + label.slice(1)}
      </p>
      <p>{`${valueInText()}`}</p>
    </div>
  );
};

export default CompoundModal;
