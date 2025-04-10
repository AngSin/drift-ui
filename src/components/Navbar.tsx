"use client";
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {Button, CloseButton, Drawer, Portal} from "@chakra-ui/react";
import {
  BASE_PRECISION,
  BN,
  BulkAccountLoader,
  DriftClient,
  getMarketOrderParams,
  initialize, PerpMarketAccount,
  PerpMarkets, PositionDirection,
  PublicKey,
  User
} from "@drift-labs/sdk";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";
// import {getAssociatedTokenAddress} from "@solana/spl-token";
import { connection } from "@/utils/constants";
import {PerpMarketConfig} from "@drift-labs/sdk/src/constants/perpMarkets";
import AccountsDrawer from "@/components/AccountsDrawer";

const Navbar = () => {
  const { connected, connecting, publicKey: userPubKey } = useWallet();
  const wallet = useAnchorWallet();

  const onClick = async () => {
    if (userPubKey && wallet) {
      const sdkConfig = initialize({ env: WalletAdapterNetwork.Mainnet });
      // const usdcTokenAddress = await getAssociatedTokenAddress(
      //   new PublicKey(sdkConfig.USDC_MINT_ADDRESS),
      //   userPubKey
      // );

      const driftPublicKey = new PublicKey(sdkConfig.DRIFT_PROGRAM_ID);
      const bulkAccountLoader = new BulkAccountLoader(
        connection,
        'confirmed',
        1000
      );

      const driftClient = new DriftClient({
        connection,
        wallet,
        programID: driftPublicKey,
        accountSubscription: {
          type: 'polling',
          accountLoader: bulkAccountLoader,
        },
      });

      await driftClient.subscribe();
      console.log('user public key', (await driftClient.getUserAccountPublicKey()).toString());
      console.log('subscribed to driftClient');

      // Set up user client
      const user = new User({
        driftClient: driftClient,
        userAccountPublicKey: await driftClient.getUserAccountPublicKey(),
        accountSubscription: {
          type: 'polling',
          accountLoader: bulkAccountLoader,
        },
      });

      //// Check if user account exists for the current wallet
      // const userAccountExists = await user.exists();

      console.log('user', user);
      console.log('user', user.getUserAccountPublicKey().toString());

      await user.subscribe();

      // Get current price
      const solMarketInfo = PerpMarkets[WalletAdapterNetwork.Mainnet].find(
        (market) => market.baseAssetSymbol === 'SOL'
      ) as PerpMarketConfig;


      const solMarketAccount = driftClient.getPerpMarketAccount(
        solMarketInfo.marketIndex
      ) as PerpMarketAccount;
      console.log('solMarketInfo', solMarketInfo);
      console.log('solMarketAccount', solMarketAccount);

      console.log(WalletAdapterNetwork.Mainnet, `Placing a 1 SOL-PERP LONG order`);

      const txSig = await driftClient.placePerpOrder(
        getMarketOrderParams({
          baseAssetAmount: new BN(1).mul(BASE_PRECISION),
          direction: PositionDirection.LONG,
          marketIndex: solMarketAccount.marketIndex,
        }),
      );
      console.log(
        WalletAdapterNetwork.Mainnet,
        `Placed a 1 SOL-PERP LONG order. Tranaction signature: ${txSig}`
      );
    }
  };

  return (
    <div className="flex justify-end w-full">
      <WalletMultiButton>
        {connected ? (
          <span className="flex items-center gap-2">
            {userPubKey?.toBase58().slice(0, 6)}...
            {userPubKey?.toBase58().slice(-4)}
              </span>
        ) : (
          <span className="flex items-center gap-2">
                {connecting ? (
                  'Connecting...'
                ) : (
                  <>
                    Connect Wallet
                  </>
                )}
              </span>
        )}
      </WalletMultiButton>
      <AccountsDrawer />
    </div>
  );
};

export default Navbar;