import { FC, useState } from 'react';
import { useAtom } from 'jotai';
import Button from '@components/Library/Button';
import ModalWrapper from '@components/Library/ModalWrapper';
import { accountAtom } from '@store/accountAtoms';
import {
  mainModalOpenAtom,
  selectedTaskAtom,
  stopCompModalOpenAtom,
  turingAddressAtom,
  turingHelperAtom,
} from '@store/commonAtoms';
import { useMutation } from 'urql';
import { UpdateXcmpTaskMutation } from '@utils/api';
import Loader from '@components/Library/Loader';
import { useToast } from '@chakra-ui/react';

const StopCompoundingModal: FC = () => {
  const [account] = useAtom(accountAtom); // selected account
  const [turingHelper] = useAtom(turingHelperAtom);
  const [currentTask] = useAtom(selectedTaskAtom);
  const [openStopComp, setOpenStopComp] = useAtom(stopCompModalOpenAtom);
  const [, setOpenMainModal] = useAtom(mainModalOpenAtom);
  const [turingAddress] = useAtom(turingAddressAtom);

  // Process States
  const [isInProcess, setIsInProcess] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

  const handleStopCompounding = async () => {
    const signer = account?.wallet?.signer;
    console.log('Canceling task with taskid', currentTask?.taskId);
    setIsInProcess(true);
    setIsSigning(true);

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
      toast
    );

    setIsInProcess(false);
    setIsSigning(false);

    updateXcmpTaskHandler(
      currentTask?.taskId as string,
      turingAddress as string,
      currentTask?.lpName as string,
      currentTask?.chain as string,
      'CANCELLED'
    );
    console.log(`Task cancelled withtaskId ${currentTask?.taskId}`);
  };

  return (
    <ModalWrapper open={openStopComp} setOpen={setOpenStopComp}>
      <div className="w-full flex flex-col gap-y-12">
        <p className="text-base leading-[21.6px] text-[#B9B9B9] text-center w-full">
          Are you sure you want to stop Autocompounding?
        </p>
        <div className="inline-flex gap-x-2 w-full">
          <Button
            type={'warning'}
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
              setOpenStopComp(false);
            }}
          />
        </div>
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
      </div>
    </ModalWrapper>
  );
};

export default StopCompoundingModal;
