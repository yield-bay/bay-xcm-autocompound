import { FC, useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import Button from '@components/Library/Button';
import Loader from '@components/Library/Loader';
import ModalWrapper from '@components/Library/ModalWrapper';
import Stepper from '@components/Library/Stepper';
import {
  mainModalOpenAtom,
  addLiqModalOpenAtom,
  selectedFarmAtom,
  mangataHelperAtom,
  turingAddressAtom,
  account1Atom,
  poolsAtom,
  addLiquidityConfigAtom,
  lpUpdatedAtom,
} from '@store/commonAtoms';
import { formatTokenSymbols, replaceTokenSymbols } from '@utils/farmMethods';
import { accountAtom } from '@store/accountAtoms';
import _ from 'lodash';
import { useToast } from '@chakra-ui/react';
import ToastWrapper from '@components/Library/ToastWrapper';
import { TokenType } from '@utils/types';
import { createLiquidityEventMutation } from '@utils/api';
import { useMutation } from 'urql';
import getTimestamp from '@utils/getTimestamp';

const AddLiquidityModal: FC = () => {
  const [, setOpenMainModal] = useAtom(mainModalOpenAtom);
  const [account] = useAtom(accountAtom);
  const [account1] = useAtom(account1Atom);
  const [isModalOpen, setIsModalOpen] = useAtom(addLiqModalOpenAtom);
  const [farm] = useAtom(selectedFarmAtom);
  const [mangataHelper] = useAtom(mangataHelperAtom);
  const [turingAddress] = useAtom(turingAddressAtom);
  const [pools] = useAtom(poolsAtom);
  const [config] = useAtom(addLiquidityConfigAtom);
  const [lpUpdated, setLpUpdated] = useAtom(lpUpdatedAtom);

  const toast = useToast();

  // Process states
  const [isInProcess, setIsInProcess] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [token0, token1] = formatTokenSymbols(
    replaceTokenSymbols(farm?.asset.symbol ?? 'MGR-TUR LP')
  );

  // Mutation to add config as a createLiquidityEvent
  const [createLiquidityEventResult, createLiquidityEvent] = useMutation(
    createLiquidityEventMutation
  );
  const createLiquidityEventHandler = async (
    userAddress: string,
    chain: string,
    token0: TokenType,
    token1: TokenType,
    lp: TokenType,
    timestamp: string,
    gasFee: number,
    eventType: string
  ) => {
    const variables = {
      userAddress,
      chain,
      token0,
      token1,
      lp,
      timestamp,
      gasFee,
      eventType,
    };
    console.log('Updating the createLiquidityEvent...');
    createLiquidityEvent(variables).then((result) => {
      console.log('createLiquidityEvent Result', result);
    });
  };

  // Method to call to Add Liquidity confirmation
  const handleAddLiquidity = async () => {
    setIsInProcess(true);
    const pool = _.find(pools, {
      firstTokenId: mangataHelper.getTokenIdBySymbol(token0),
      secondTokenId: mangataHelper.getTokenIdBySymbol(token1),
    });

    const signer = account?.wallet?.signer;

    console.log(
      'pool.firstTokenAmountFloat',
      pool.firstTokenAmountFloat,
      'pool.secondTokenAmountFloat',
      pool.secondTokenAmountFloat,
      'firstTokenAmount',
      config.firstTokenAmount,
      'expectedSecondTokenAmount',
      config.secondTokenAmount // expectedSecondTokenAmount
    );

    try {
      // Method to Add Liquidity
      const mintLiquidityTxn = await mangataHelper.mintLiquidityTx(
        pool.firstTokenId,
        pool.secondTokenId,
        config.firstTokenAmount,
        config.secondTokenAmount // expectedSecondTokenAmount
      );
      setIsSigning(true);

      await mintLiquidityTxn
        .signAndSend(
          account1?.address,
          { signer: signer },
          ({ status }: any) => {
            if (status.isInBlock) {
              console.log(
                `Mint liquidity trxn is in Block with hash ${status.asInBlock.toHex()}`
              );
              // unsub();
            } else if (status.isFinalized) {
              setIsSuccess(true);
              setIsInProcess(false);
              setIsSigning(false);
              setLpUpdated(lpUpdated + 1);
              console.log('Mint liquidity trxn finalised.');
              toast({
                position: 'top',
                duration: 3000,
                render: () => (
                  <ToastWrapper
                    title={`Liquidity successfully added in ${token0}-${token1} pool.`}
                    status="info"
                  />
                ),
              });
              // unsub();
              // Calling the ADD_LIQUIDITY tracker in isFinalised status
              createLiquidityEventHandler(
                turingAddress as string,
                'ROCOCO',
                { symbol: token0, amount: config.firstTokenAmount },
                { symbol: token1, amount: config.secondTokenAmount },
                { symbol: `${token0}-${token1}`, amount: 0 },
                getTimestamp(),
                config.fees,
                'ADD_LIQUIDITY'
              );
            } else {
              console.log('Status:', status.type);
              setIsSigning(false);
            }
          }
        )
        .catch((err: any) => {
          console.log('Error while minting liquidity: ', err);
          setIsInProcess(false);
          setIsSigning(false);
          setIsSuccess(false);
          toast({
            position: 'top',
            duration: 3000,
            render: () => (
              <ToastWrapper
                title="Error while minting Liquidity!"
                status="error"
              />
            ),
          });
        });
    } catch (error) {
      let errorString = `${error}`;
      console.log('error while adding liquidity:', errorString);
      toast({
        position: 'top',
        duration: 3000,
        render: () => <ToastWrapper title={errorString} status="error" />,
      });
      setIsInProcess(false);
      setIsSigning(false);
    }
  };

  useEffect(() => {
    // Resetting all states to default on open/close
    setIsInProcess(false);
    setIsSigning(false);
    setIsSuccess(false);
  }, [isModalOpen]);

  return (
    <ModalWrapper
      open={isModalOpen || isInProcess}
      setOpen={isInProcess ? () => {} : setIsModalOpen}
    >
      {!isInProcess && !isSuccess && (
        <div className="w-full flex flex-col gap-y-12">
          <p className="text-left w-full">
            Adding Liquidity to {token0}-{token1} Pool
          </p>
          <div className="flex flex-col items-start">
            <p className="mb-3">From</p>
            <div className="inline-flex justify-start gap-x-8">
              <TokenLabels symbol={token0} amount={config.firstTokenAmount} />
              <TokenLabels symbol={token1} amount={config.secondTokenAmount} />
            </div>
          </div>
          <div className="flex flex-col items-start">
            <p className="mb-3">To</p>
            <div className="inline-flex justify-start gap-x-8">
              <TokenLabels
                symbol={`${token0}-${token1}`}
                amount={config.lpAmount}
              />
            </div>
          </div>
          <div className="inline-flex gap-x-2 w-full">
            <Button
              type="secondary"
              text="Confirm"
              onClick={handleAddLiquidity}
              className="w-1/2"
            />
            <Button
              type="warning"
              text="Cancel"
              className="w-1/2"
              onClick={() => {
                setOpenMainModal(true);
                setIsModalOpen(false);
              }}
            />
          </div>
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
            Liquidity Added: {config.firstTokenAmount} {token0} with{' '}
            {config.secondTokenAmount} {token1}.
          </div>
          <button
            className="w-full py-[13px] text-base leading-[21.6px] rounded-lg border border-[#7D7D7D]"
            onClick={() => {
              setIsModalOpen(false);
            }}
          >
            Go Home
          </button>
        </div>
      )}
      {!isSuccess && (
        <Stepper
          activeStep={!isInProcess ? 0 : isSigning ? 1 : 2}
          steps={[
            { label: 'Confirm' },
            { label: 'Sign' },
            { label: 'Complete' },
          ]}
        />
      )}
    </ModalWrapper>
  );
};

const TokenLabels = ({
  symbol,
  amount,
}: {
  symbol: string;
  amount: number;
}) => (
  <div className="flex flex-col gap-y-[2px]">
    <p className="text-[#969595]">{symbol}</p>
    <p>{amount.toFixed(3)}</p>
  </div>
);

export default AddLiquidityModal;
