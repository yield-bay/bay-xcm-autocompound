import _ from 'lodash';
import { rpc, types, runtime } from '@oak-network/types';
import { ApiPromise, WsProvider } from '@polkadot/api';
import Keyring from '@polkadot/keyring';
import ToastWrapper from '@components/Library/ToastWrapper';
import { getProxies, getProxyAccount } from './utils';
import { delay } from '@utils/xcm/common/utils';

class TuringHelper {
  constructor(config) {
    this.config = config;
  }

  initialize = async () => {
    const api = await ApiPromise.create({
      provider: new WsProvider(this.config.endpoint),
      rpc,
      types,
      runtime,
    });

    this.api = api;
    this.assets = this.config.assets;
    this.keyring = new Keyring({
      type: 'sr25519',
      ss58Format: this.config.ss58,
    });
  };

  getApi = () => this.api;

  getBalance = async (address) => {
    // Retrieve the account balance & nonce via the system module
    const { data: balance } = await this.api.query.system.account(address);

    return balance;
  };

  getTokenBalance = async (address, tokenId) =>
    this.api.query.tokens.accounts(address, tokenId);

  /**
   * Get XCM fees
   * Fake sign the call in order to get the combined fees from Turing.
   * Turing xcmpHandler_fees RPC requires the encoded call in this format.
   * Fees returned include inclusion, all executions, and XCMP fees to run on Target Chain.
   * @param {*} address
   * @param {*} xcmpCall
   * @returns
   */
  getXcmFees = async (address, xcmpCall) => {
    const fakeSignedXcmpCall = xcmpCall.signFake(address, {
      blockHash: this.api.genesisHash,
      genesisHash: this.api.genesisHash,
      nonce: 100, // does not except negative?
      runtimeVersion: this.api.runtimeVersion,
    });

    const fees = await this.api.rpc.xcmpHandler.fees(
      fakeSignedXcmpCall.toHex()
    );
    return fees;
  };

  queryFeeDetails = async (xcmpCall) => {
    return await this.api.rpc.automationTime.queryFeeDetails(xcmpCall);
  };

  sendXcmExtrinsic = async (
    xcmpCall,
    keyPair,
    signer,
    // taskId,
    setIsSigning,
    setIsInProcess,
    setIsSuccess,
    setIsFailed,
    toast
  ) =>
    new Promise((resolve) => {
      const send = async () => {
        setIsInProcess(true);
        const unsub = await xcmpCall
          .signAndSend(
            keyPair,
            { signer: signer, nonce: -1 },
            async ({ status, events }) => {
              if (status.isInBlock) {
                console.log('Transaction is in Block now!');
                console.log(`Successful with hash ${status.asInBlock.toHex()}`);
                // console.log('kpaddr', keyPair, 'task', taskId);
                // // Get Task
                // const task = await this.api.query.automationTime.accountTasks(
                //   keyPair,
                //   taskId
                // );
                // console.log('Task:', task);
                // unsub();
                // resolve();
              } else if (status.isFinalized) {
                console.log('Transaction is Finalized!');
                console.log(
                  `Finalized block hash ${status.asFinalized.toHex()}`
                );
                (async () => {
                  const tranHash = status.asFinalized.toString();
                  console.log(
                    `Batch Tx finalized with hash ${tranHash}\n\nbefore delay\n`
                  );
                  await delay(20000);
                  console.log('after delay');

                  const block = await this.api.rpc.chain.getBlock(
                    tranHash
                  );
                  console.log('block', block);
                  console.log('block', JSON.stringify(block));
                  const bhn = parseInt(block.block.header.number) + 1;
                  console.log('num', bhn);
                  const blockHash =
                    await this.api.rpc.chain.getBlockHash(bhn);
                  console.log(`blockHash ${blockHash}`);
                  console.log('bhjs', JSON.stringify(blockHash) ?? 'nothing');
                  const at = await this.api.at(blockHash);
                  const blockEvents = await at.query.system.events();
                  console.log('blockEvents', blockEvents);
                  let allSuccess = true;
                  console.log('allSuccess before', allSuccess);
                  blockEvents.forEach((d) => {
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
                      // method === 'BatchInterrupted' ||
                      method === 'ExtrinsicFailed'
                    ) {
                      console.log('failed is true');
                      // failed = true;
                      console.log('Error in Tx:');
                      allSuccess = false;

                      setIsInProcess(false);
                      setIsSigning(false);
                      setIsSuccess(false);
                      setIsFailed(true);
                      toast({
                        position: 'top',
                        duration: 3000,
                        render: () => <ToastWrapper title={"Extrinsic Failed"} status="error" />,
                      });
                      // toast({
                      //   position: 'top',
                      //   duration: 3000,
                      //   render: () => (
                      //     <ToastWrapper
                      //       title="Failed to transfer TUR"
                      //       status="error"
                      //     />
                      //   ),
                      // });
                    }
                  });
                  console.log('allSuccess after', allSuccess);
                  if (allSuccess) {
                    console.log('allSuccess', allSuccess);
                    // setIsInProcess(false); // Process will be done when ScheduleXCMP Txn is done
                    // setBatchTxDone(true);
                    setIsInProcess(false);
                    setIsSigning(false);
                    setIsSuccess(true);
                    // resolve({ events, blockHash: status.asFinalized.toString() });
                  }
                  resolve({ events, blockHash: status.asFinalized.toString() });
                })();
                // setIsInProcess(false);
                // setIsSigning(false);
                // setIsSuccess(true);
              } else {
                setIsSigning(false); // Reaching here means the trxn is signed
                console.log(`Status: ${status.type}`);
              }
            }
          )
          .catch((error) => {
            console.log('sendXcmExtrinsic Err --\n', error);
            let errorString = `${error}`;
            setIsInProcess(false);
            setIsSigning(false);
            setIsSuccess(false);
            setIsFailed(true);
            toast({
              position: 'top',
              duration: 3000,
              render: () => <ToastWrapper title={errorString} status="error" />,
            });
          });
      };
      send();
    });

  getProxyAccount = (address, paraId) => {
    const accountId = getProxyAccount(this.api, paraId, address);
    return this.keyring.encodeAddress(accountId);
  };

  getProxies = async (address) => getProxies(this.api, address);

  getFeePerSecond = async (assetId) => {
    const {
      additional: { feePerSecond },
    } = (await this.api.query.assetRegistry.metadata(assetId)).toJSON();
    return feePerSecond;
  };

  /**
   * Returns the decimal number such as 18 for a specific asset
   * @param {string} symbol such as TUR
   * @returns 10 for TUR
   */
  getDecimalsBySymbol(symbol) {
    const token = _.find(this.assets, { symbol });
    return token.decimals;
  }

  getAssetIdByLocation = async (assetLocation) => {
    const assetId = (
      await this.api.query.assetRegistry.locationToAssetId(assetLocation)
    )
      .unwrapOrDefault()
      .toNumber();
    return assetId;
  };

  calculateXcmTransactOverallWeight = (transactCallWeight) => calculateXcmOverallWeight(transactCallWeight, this.config.instructionWeight, 6);

  weightToFee = async (weight, assetLocation) => {
      const assetId = await this.getAssetIdByLocation(assetLocation);
      const feePerSecond = await this.getFeePerSecond(assetId);
      console.log(`weight: (${weight.refTime.toString()}, ${weight.proofSize.toString()})`);
      const result = weight.refTime.mul(new BN(feePerSecond)).div(new BN(WEIGHT_REF_TIME_PER_SECOND));
      return result;
  };
}

export default TuringHelper;
