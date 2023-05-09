import { FC, useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import Button from '@components/Library/Button';
import ModalWrapper from '@components/Library/ModalWrapper';
import { accountAtom } from '@store/accountAtoms';
import {
  mainModalOpenAtom,
  selectedTaskAtom,
  turingAddressAtom,
  turingHelperAtom,
  stopCompModalOpenAtom,
  taskUpdatedAtom,
  mangataHelperAtom,
  account1Atom,
} from '@store/commonAtoms';
import { useMutation } from 'urql';
import { delay } from '@utils/xcm/common/utils';
import {
  updateAutocompoundEventStatusMutation,
  UpdateXcmpTaskMutation,
} from '@utils/api';
import Loader from '@components/Library/Loader';
import { useToast } from '@chakra-ui/react';
import { TokenType } from '@utils/types';
import ToastWrapper from '@components/Library/ToastWrapper';
import Stepper from '@components/Library/Stepper';
import Link from 'next/link';
import { IS_PRODUCTION } from '@utils/constants';
import { useQuery } from '@tanstack/react-query';
import { fetchTokenPrices } from '@utils/fetch-prices';
import Image from 'next/image';
import Tooltip from '@components/Library/Tooltip';

const StopCompoundingModal: FC = () => {
  const [account] = useAtom(accountAtom); // selected account
  const [mangataHelper] = useAtom(mangataHelperAtom);
  const [turingHelper] = useAtom(turingHelperAtom);
  const [currentTask] = useAtom(selectedTaskAtom);
  const [isModalOpen, setIsModalOpen] = useAtom(stopCompModalOpenAtom);
  const [, setOpenMainModal] = useAtom(mainModalOpenAtom);
  const [turingAddress] = useAtom(turingAddressAtom);
  const [taskUpdated, setTaskUpdated] = useAtom(taskUpdatedAtom);
  const [account1] = useAtom(account1Atom);

  // Process States
  const [isInProcess, setIsInProcess] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [transferTurDone, setTransferTurDone] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFailed, setIsFailed] = useState(false);

  // Fees and Balances
  const [cancelFees, setCancelFees] = useState<number>(0);
  const [turBalance, setTurBalance] = useState<number>(0); // TUR balance on Mangata
  const [turBalanceTuring, setTurBalanceTuring] = useState<number>(0); // TUR

  const toast = useToast();

  useEffect(() => {
    // Resetting all states to default on open/close
    setIsInProcess(false);
    setIsSigning(false);
    setIsSuccess(false);
    setIsFailed(false);
  }, [isModalOpen]);

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

  // fees for canceling the task
  const fetchTurFees = async () => {
    if (turingHelper == null) return;
    const pinfo = await turingHelper.api.tx.automationTime
      .cancelTask(currentTask?.taskId)
      .paymentInfo(turingAddress);

    const cancelTaskFees =
      parseFloat(JSON.stringify(pinfo.partialFee)) / 10 ** 10;
    setCancelFees(cancelTaskFees);
    console.log('paymentInfo', cancelTaskFees);

    // Fetching TUR Balances on both chains

    // TUR Balance on Mangata Network
    const turBalance = await mangataHelper.mangata?.getTokenBalance(
      '7', // TUR TokenId
      account?.address
    );
    const turBalanceFree =
      parseFloat(BigInt(turBalance.free).toString(10)) / 10 ** 10;
    console.log('turFreeBal on Mangata', turBalanceFree);
    setTurBalance(turBalanceFree);

    // TUR Balance on Turing Network
    const turBalanceTuring = await turingHelper.getBalance(turingAddress);
    const turFreeBalTuring =
      BigInt(turBalanceTuring.free).toString(10) / 10 ** 10;
    // const turFreeBalTuring = turBalanceTuring?.toHuman()?.free;
    console.log('turFreeBal on Turing', turFreeBalTuring);
    setTurBalanceTuring(turFreeBalTuring);

    if (turBalanceFree + turFreeBalTuring < cancelTaskFees) {
      console.log('Insufficient balance to cancel the task!');
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      fetchTurFees();
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (isSuccess) {
      console.log(
        'Calling addXcmpTaskHandler and createAutocompoundingHandler...'
      );

      // Updating compounding counter
      setTaskUpdated(taskUpdated + 1);

      console.log('variables to stop compounding', {
        taskId: currentTask?.taskId,
        userAddress: turingAddress,
        lpName: currentTask?.lpName,
        chain: currentTask?.chain,
        newStatus: 'CANCELLED',
      });

      updateXcmpTaskHandler(
        currentTask?.taskId as string,
        turingAddress as string,
        currentTask?.lpName as string,
        currentTask?.chain as string,
        'CANCELLED'
      );
      // Update Autocompounding Event in Tracking
      updateAutocompoundingHandler(
        turingAddress as string,
        IS_PRODUCTION ? 'KUSAMA' : 'ROCOCO',
        currentTask?.taskId as string,
        {
          symbol: currentTask?.lpName as string,
          amount: 100, // Need to confirm what to put here.
        },
        'CANCELLED'
      );
      console.log('XcmpTask and UpdateAutocompounding updated successfully');
    }
  }, [isSuccess]);

  // UPDATE TASK
  const [updateXcmpTaskResult, updateXcmpTask] = useMutation(
    UpdateXcmpTaskMutation
  );
  const updateXcmpTaskHandler = async (
    taskId: string,
    userAddress: string,
    lpName: string,
    chain: string,
    newStatus: string
  ) => {
    const variables = { taskId, userAddress, lpName, chain, newStatus };
    console.log('Updating task...');
    updateXcmpTask(variables).then((result) => {
      console.log('updateXcmpTask result', result);
    });
  };

  const [updateAutocompoundEventResult, updateAutocompoundEvent] = useMutation(
    updateAutocompoundEventStatusMutation
  );
  const updateAutocompoundingHandler = async (
    userAddress: string,
    chain: string,
    taskId: string,
    lp: TokenType,
    newStatus: string
  ) => {
    const variables = {
      userAddress,
      chain,
      taskId,
      lp,
      newStatus,
    };
    console.log('Updating the autocompounding event...');
    updateAutocompoundEvent(variables).then((result) => {
      console.log('updateAutocompounding Result', result);
    });
  };

  const handleTransferTur = async () => {
    const signer = account?.wallet?.signer;
    setIsInProcess(true);
    setIsSigning(true);

    try {
      const transferTurTx = await mangataHelper.transferTur(
        cancelFees, // Amount to transfer on Turing from Mangata
        turingAddress
      );
      await transferTurTx
        .signAndSend(
          account1?.address,
          { signer: signer },
          ({ status, events, dispatchError }: any) => {
            if (status.isInBlock) {
              console.log(
                `transferTUR Tx is in block with hash ${status.asInBlock.toHex()}`
              );
            } else if (status.isFinalized) {
              (async () => {
                const tranHash = status.asFinalized.toString();
                console.log(
                  `transfertur Tx finalized with hash ${tranHash}\n\nbefore delay\n`
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
                          title="Failed to transfer TUR to Turing Network."
                          status="error"
                        />
                      ),
                    });
                  }
                });
                if (allSuccess) {
                  console.log('allSuccess', allSuccess);
                  setIsInProcess(false); // Process for step 1 is done
                  setTransferTurDone(true); // Transaction on Mangata is done
                }
              })();
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
              <ToastWrapper
                title="Failed to transfer TUR to Turing Network. Please try again later."
                status="error"
              />
            ),
          });
        });
    } catch (error) {
      console.log('error', error);
      setIsInProcess(false);
      setIsSigning(false);
      toast({
        position: 'top',
        duration: 3000,
        render: () => (
          <ToastWrapper
            title="Failed to transfer TUR to Turing Network. Please try again later."
            status="error"
          />
        ),
      });
    }
  };

  const handleStopCompounding = async () => {
    const signer = account?.wallet?.signer;
    console.log('Canceling task with taskid', currentTask?.taskId);
    setIsInProcess(true);
    setIsSigning(true);

    try {
      // remove liquidity
      // 1. turingHelper-> canceltask
      // 2. mangataHelper -> burnLiquidity
      const cancelTx = await turingHelper.api.tx.automationTime.cancelTask(
        currentTask?.taskId
      );

      await turingHelper.sendXcmExtrinsic(
        cancelTx,
        account?.address,
        signer,
        currentTask?.taskId,
        setIsSigning,
        setIsInProcess,
        setIsSuccess,
        setIsFailed,
        toast
      );
      console.log(`Task cancelled withtaskId ${currentTask?.taskId}`);
    } catch (error) {
      let errorString = `${error}`;
      console.log('error in stopping compounding task:', errorString);
      setIsFailed(true);
      if (
        errorString ==
        'PW: 1010: Invalid Transaction: Inability to pay some fees, e.g. account balance too low'
      ) {
        console.log('accbaltoolowcase');
        errorString =
          'Not enough TUR balance on Turing to stop autocompounding';
      }
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
      open={isModalOpen || isInProcess}
      setOpen={isInProcess ? () => {} : setIsModalOpen}
    >
      <div className="w-full flex flex-col gap-y-12">
        {!isInProcess && !isSuccess && (
          <div className="w-full flex flex-col gap-y-12">
            <p className="text-lg leading-[21.6px] text-[#B9B9B9] text-center w-full">
              Are you sure you want to stop Autocompounding?
            </p>
            {!transferTurDone && (
              <div className="flex flex-col items-center gap-y-5">
                {isTurpriceLoading || cancelFees == 0 ? (
                  <p className="text-[#B9B9B9] text-base text-center leading-[21.6px]">
                    Calculating fees...
                  </p>
                ) : (
                  <p className="text-[#B9B9B9] text-base text-center leading-[21.6px]">
                    Costs{' '}
                    {!isNaN(turprice) && (
                      <span className="text-white">
                        {cancelFees?.toFixed(2)} TUR
                      </span>
                    )}{' '}
                    <span className="text-white">
                      (${(cancelFees * turprice).toFixed(2)})
                    </span>{' '}
                    including Gas Fees
                  </p>
                )}
                <div className="w-fit inline-flex gap-x-2 text-center text-base leading-[21.6px] rounded-lg bg-[#232323] py-4 px-6">
                  <span className="text-primaryGreen">Balance on Turing:</span>
                  <p>
                    {turBalanceTuring.toFixed(3) ?? 'loading...'} TUR
                    {!isNaN(turprice) && (
                      <span className="text-[#8A8A8A] ml-2">
                        ${(turBalanceTuring * turprice).toFixed(3)}
                      </span>
                    )}
                  </p>
                  {turBalanceTuring < cancelFees && ( // If balance is not enough on Turing Network
                    <Tooltip
                      label="Your TUR will be first transferred to Turing"
                      placement="bottom"
                    >
                      <Image
                        src="/icons/Warning.svg"
                        alt="Insufficient Balance Warning!"
                        width={24}
                        height={24}
                      />
                    </Tooltip>
                  )}
                </div>
              </div>
            )}
            <div className="inline-flex gap-x-2 w-full">
              {!transferTurDone ? (
                <Button
                  type={
                    turBalanceTuring < cancelFees && turBalance >= cancelFees
                      ? 'primary'
                      : 'warning'
                  }
                  text={
                    turBalanceTuring >= cancelFees // Considering both Turing and Mangata balances
                      ? 'Stop Autocompounding'
                      : turBalance >= cancelFees
                      ? 'Swap TUR from Mangata'
                      : 'Insufficient TUR balance'
                  }
                  disabled={
                    turBalance + turBalanceTuring < cancelFees ||
                    cancelFees == 0
                  }
                  className="w-1/2"
                  onClick={() => {
                    if (turBalanceTuring >= cancelFees) {
                      handleStopCompounding();
                      console.log('xcmp task to stop', currentTask);
                    } else if (turBalance >= cancelFees) {
                      handleTransferTur();
                      console.log('handleTransferTur called.');
                    } else {
                      console.log('Button should be disabled!');
                      toast({
                        position: 'top',
                        duration: 3000,
                        render: () => (
                          <ToastWrapper
                            title="Insufficient TUR balance on even Mangata to swap"
                            status="error"
                          />
                        ),
                      });
                    }
                  }}
                />
              ) : (
                <Button
                  type="warning"
                  text="Stop Autocompounding"
                  onClick={() => {
                    handleStopCompounding();
                    console.log('xcmp task to stop', currentTask);
                  }}
                  className="w-1/2"
                />
              )}
              {/* Its allowed to go back as step 1 just swapping TUR and process isn't started yet */}
              <Button
                type="secondary"
                text="Go Back"
                className="w-1/2"
                onClick={() => {
                  setOpenMainModal(true);
                  setIsModalOpen(false);
                }}
              />
            </div>
          </div>
        )}
        {/* When balance is enough on Turing Network */}
        {/* {isInProcess && (
          <div className="flex flex-row gap-x-6 py-14 items-center justify-center text-xl leading-[27px] bg-baseGray rounded-lg select-none">
            <Loader size="md" />
            {isSigning ? (
              <span className="text-center max-w-[272px]">
                Please Sign the Transaction on Turing in your wallet.
              </span>
            ) : (
              <div className="text-left max-w-[280px]">
                <p>Completing Transaction..</p>
                <p>This may take a few seconds</p>
              </div>
            )}
          </div>
        )} */}
        {/*
          If balance is not enough on Turing Network 
          Transfer TUR from Mangata to Turing
          Stop Auto-ompounding
        */}
        {isInProcess && turBalanceTuring < cancelFees ? (
          <div className="flex flex-row gap-x-6 py-14 items-center justify-center text-xl leading-[27px] bg-baseGray rounded-lg">
            {!isSuccess && <Loader size="md" />}
            {isSigning ? (
              !transferTurDone ? (
                <span className="text-center max-w-[272px]">
                  Please Sign the Transaction on Mangata in your wallet.
                </span>
              ) : (
                <span className="text-center max-w-[272px]">
                  Please Sign the Transaction on Turing your wallet.
                </span>
              )
            ) : (
              <div className="text-left max-w-[280px]">
                <p>Completing Transaction..</p>
                <p>This may take a few seconds</p>
              </div>
            )}
          </div>
        ) : (
          isInProcess && (
            <div className="flex flex-row gap-x-6 py-14 items-center justify-center text-xl leading-[27px] bg-baseGray rounded-lg select-none">
              <Loader size="md" />
              {isSigning ? (
                <span className="text-center max-w-[272px]">
                  Please Sign the Transaction on Turing in your wallet.
                </span>
              ) : (
                <div className="text-left max-w-[280px]">
                  <p>Completing Transaction..</p>
                  <p>This may take a few seconds</p>
                </div>
              )}
            </div>
          )
        )}
        {isSuccess && (
          <div className="flex flex-col gap-y-12">
            <div className="py-14 text-center text-xl leading-[27px] bg-baseGray ro`unded-lg">
              <p>Successful stopped Autocompounding!</p>
              <p>Close modal & Refresh to update.</p>
            </div>
            <button
              className="w-full py-[13px] text-base leading-[21.6px] rounded-lg border border-[#7D7D7D]"
              onClick={() => {
                setIsModalOpen(false);
                setTaskUpdated(taskUpdated + 1); // Refresh the task list on closing modal
              }}
            >
              Go to Home
            </button>
          </div>
        )}
        {!isSuccess && turBalanceTuring >= cancelFees ? (
          <Stepper
            activeStep={isSuccess ? 2 : isSigning ? 1 : 0}
            steps={[
              { label: 'Confirm' },
              { label: 'Sign' },
              { label: 'Complete' },
            ]}
          />
        ) : !isSuccess && turBalance >= cancelFees ? (
          <Stepper
            activeStep={
              isSuccess ? 3 : transferTurDone ? 2 : isInProcess ? 1 : 0
            }
            steps={[
              { label: 'Confirm' },
              { label: 'MGX' },
              { label: 'TUR' },
              { label: 'Complete' },
            ]}
          />
        ) : null}
        {!isInProcess && !isSuccess && (
          <p className="text-center text-sm font-semibold leading-[21.6px] text-[#868686]">
            Disclaimer: Currently, the gas fee paid while setting up
            auto-compounding will not be refunded.
          </p>
        )}
      </div>
    </ModalWrapper>
  );
};

export default StopCompoundingModal;
