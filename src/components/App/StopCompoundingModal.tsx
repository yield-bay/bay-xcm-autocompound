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
} from '@store/commonAtoms';
import { useMutation } from 'urql';
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

const StopCompoundingModal: FC = () => {
  const [account] = useAtom(accountAtom); // selected account
  const [turingHelper] = useAtom(turingHelperAtom);
  const [currentTask] = useAtom(selectedTaskAtom);
  const [isModalOpen, setIsModalOpen] = useAtom(stopCompModalOpenAtom);
  const [, setOpenMainModal] = useAtom(mainModalOpenAtom);
  const [turingAddress] = useAtom(turingAddressAtom);
  const [taskUpdated, setTaskUpdated] = useAtom(taskUpdatedAtom);

  // Process States
  const [isInProcess, setIsInProcess] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [cancelFees, setCancelFees] = useState<number>(0);
  const [turFreeBalance, setTurFreeBalance] = useState<number>(0);

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

    const turBalance = await turingHelper.getBalance(turingAddress);
    const turFreeBalance = BigInt(turBalance.free).toString(10) / 10 ** 10;
    setTurFreeBalance(turFreeBalance);

    console.log('turBalance', turFreeBalance);
    if (turFreeBalance < cancelTaskFees) {
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
              <div className=" w-fit inline-flex gap-x-2 text-center text-base leading-[21.6px] rounded-lg bg-[#232323] py-4 px-6 select-none">
                <span className="text-primaryGreen">Balance:</span>
                <p>
                  {/* turFreeBalance is TUR balance on Turing Network */}
                  {turFreeBalance.toFixed(3) ?? 'loading...'} TUR
                  {!isNaN(turprice) && (
                    <span className="text-[#8A8A8A] ml-2">
                      ${(turFreeBalance * turprice).toFixed(3)}
                    </span>
                  )}
                </p>
              </div>
              <div className="inline-flex gap-x-2 w-full">
                <Button
                  type={'warning'}
                  text={
                    turFreeBalance < cancelFees
                      ? 'Insufficient TUR balance'
                      : isInProcess
                      ? 'Stopping the process...'
                      : 'Stop Autocompounding'
                  }
                  disabled={
                    isInProcess ||
                    isSuccess ||
                    turFreeBalance < cancelFees ||
                    cancelFees == 0
                  }
                  className="w-3/5"
                  onClick={() => {
                    handleStopCompounding();
                    console.log('xcmp task to stop', currentTask);
                  }}
                />
                <Button
                  type="secondary"
                  text="Go Back"
                  className="w-2/5"
                  disabled={isInProcess || isSuccess}
                  onClick={() => {
                    setOpenMainModal(true);
                    setIsModalOpen(false);
                  }}
                />
              </div>
            </div>
            {isFailed && (
              <div className="flex flex-col items-center text-sm leading-[21.6px]">
                <p>Maybe you don&apos;t have enough TUR to pay gas.</p>
                <Link
                  href="https://mangata-finance.notion.site/How-to-get-TUR-bdb76dac848f4d15bf06bec7ded223ad"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primaryGreen text-center text-sm underline underline-offset-2"
                >
                  How to get TUR?
                </Link>
              </div>
            )}
          </div>
        )}
        {isInProcess && (
          <div className="flex flex-row gap-x-6 py-14 items-center justify-center text-xl leading-[27px] bg-baseGray rounded-lg select-none">
            {!isSuccess && <Loader size="md" />}
            {isSigning ? (
              <span className="text-center max-w-[272px]">
                Please Sign the Transaction in your wallet.
              </span>
            ) : (
              <div className="text-left max-w-[280px]">
                <p>Completing Transaction..</p>
                <p>This may take a few seconds</p>
              </div>
            )}
          </div>
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
        {!isSuccess && turFreeBalance >= cancelFees && (
          <Stepper
            activeStep={isSuccess ? 2 : isSigning ? 1 : 0}
            steps={[
              { label: 'Confirm' },
              { label: 'Sign' },
              { label: 'Complete' },
            ]}
          />
        )}
      </div>
    </ModalWrapper>
  );
};

export default StopCompoundingModal;
