import { FC } from 'react';
import { useAtom } from 'jotai';
import Button from '@components/Library/Button';
import ModalWrapper from '@components/Library/ModalWrapper';
import { accountAtom } from '@store/accountAtoms';
import {
  mainModalOpenAtom,
  selectedTaskAtom,
  stopCompModalOpenAtom,
  turingHelperAtom,
} from '@store/commonAtoms';

const StopCompoundingModal: FC = () => {
  const [account] = useAtom(accountAtom); // selected account
  const [turingHelper] = useAtom(turingHelperAtom);
  const [currentTask] = useAtom(selectedTaskAtom);
  const [openStopComp, setOpenStopComp] = useAtom(stopCompModalOpenAtom);
  const [, setOpenMainModal] = useAtom(mainModalOpenAtom);

  const handleStopCompounding = async () => {
    const signer = account?.wallet?.signer;

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
      currentTask?.taskId
    );
  };

  return (
    <ModalWrapper open={openStopComp} setOpen={setOpenStopComp}>
      <div className="w-full flex flex-col gap-y-12">
        <p className="text-base leading-[21.6px] text-[#B9B9B9] text-center w-full">
          Are you sure you want to stop Autocompounding?
        </p>
        <div className="inline-flex gap-x-2 w-full">
          <Button
            type="warning"
            text="Stop Autocompounding"
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
            onClick={() => {
              setOpenMainModal(true);
              setOpenStopComp(false);
            }}
          />
        </div>
      </div>
    </ModalWrapper>
  );
};

export default StopCompoundingModal;
