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

const StopCompoundingModal: FC = () => {
  const [account] = useAtom(accountAtom); // selected account
  const [turingHelper] = useAtom(turingHelperAtom);
  const [currentTask] = useAtom(selectedTaskAtom);
  const [isModalOpen, setIsModalOpen] = useAtom(stopCompModalOpenAtom);
  const [, setOpenMainModal] = useAtom(mainModalOpenAtom);
  const [turingAddress] = useAtom(turingAddressAtom);

  // Process States
  const [isInProcess, setIsInProcess] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFailed, setIsFailed] = useState(false);

  useEffect(() => {
    // Resetting all states to default on open/close
    setIsInProcess(false);
    setIsSigning(false);
    setIsSuccess(false);
    setIsFailed(false);
  }, [isModalOpen]);

  useEffect(() => {
    if (isSuccess) {
      console.log(
        'Calling addXcmpTaskHandler and createAutocompoundingHandler...'
      );

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
        'ROCOCO',
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

  const toast = useToast();

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
    <ModalWrapper open={isModalOpen || isInProcess} setOpen={setIsModalOpen}>
      <div className="w-full flex flex-col gap-y-12">
        <p className="text-base leading-[21.6px] text-[#B9B9B9] text-center w-full">
          Are you sure you want to stop Autocompounding?
        </p>
        <div className="inline-flex gap-x-2 w-full">
          <Button
            type="warning"
            text={
              isInProcess ? 'Stopping the process...' : 'Stop Autocompounding'
            }
            disabled={isInProcess || isSuccess}
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
        {isInProcess && (
          <div className="flex flex-row px-4 items-center justify-center text-base leading-[21.6px] bg-baseGray rounded-lg py-10 text-center">
            {!isSuccess && <Loader size="md" />}
            {isSigning && (
              <span className="ml-6">
                Please sign the transaction in your wallet.
              </span>
            )}
          </div>
        )}
        {isSuccess && (
          <div className="flex flex-col gap-2 px-4 items-center justify-center text-base leading-[21.6px] bg-baseGray rounded-lg py-10 text-center">
            <p>Successful stopped Autocompounding!</p>
            <p>Close modal & Refresh to update.</p>
          </div>
        )}
        <Stepper
          activeStep={isSuccess ? 2 : isSigning ? 1 : 0}
          steps={[
            { label: 'Confirm' },
            { label: 'Sign' },
            { label: 'Complete' },
          ]}
        />
      </div>
    </ModalWrapper>
  );
};

export default StopCompoundingModal;
