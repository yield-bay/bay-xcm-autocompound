import _ from 'lodash';
import { rpc, types, runtime } from '@oak-network/types';
import { ApiPromise, WsProvider } from '@polkadot/api';
import Keyring from '@polkadot/keyring';
import ToastWrapper from '@components/Library/ToastWrapper';
import { getProxies, getProxyAccount } from './utils';

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
    taskId,
    setIsSigning,
    setIsInProcess,
    setIsSuccess,
    toast
  ) =>
    new Promise((resolve) => {
      const send = async () => {
        setIsInProcess(true);
        const unsub = await xcmpCall
          .signAndSend(
            keyPair,
            { signer: signer, nonce: -1 },
            async ({ status }) => {
              if (status.isInBlock) {
                console.log('Transaction is in Block now!');
                console.log(`Successful with hash ${status.asInBlock.toHex()}`);
                console.log('kpaddr', keyPair, 'task', taskId);
                // Get Task
                const task = await this.api.query.automationTime.accountTasks(
                  keyPair,
                  taskId
                );
                console.log('Task:', task);
                // setIsSuccess(true);
                unsub();
                resolve();
              } else if (status.isFinalized) {
                consnole,log('Transaction is Finalized!');
                console.log(
                  `Finalized block hash ${status.asFinalized.toHex()}`
                );
                setIsInProcess(false);
                setIsSigning(false);
                setIsSuccess(true);
              } else {
                setIsSigning(false); // Reaching here means the trxn is signed
                console.log(`Status: ${status.type}`);
              }
            }
          )
          .catch((err) => {
            console.log('sendXcmExtrinsic Err --\n', err);
            setIsSigning(false);
            setIsSuccess(false);
            setIsInProcess(false);
            toast({
              position: 'top',
              duration: 3000,
              render: () => (
                <ToastWrapper
                  title="Error while handling automation task."
                  status="error"
                />
              ),
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

  getAssetIdByParaId = async (paraId) => {
    const assetId = (
      await this.api.query.assetRegistry.locationToAssetId({
        parents: 1,
        interior: { X1: { Parachain: paraId } },
      })
    )
      .unwrapOrDefault()
      .toNumber();
    return assetId;
  };
}

export default TuringHelper;
