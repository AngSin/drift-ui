"use client";
import {useWallet} from '@solana/wallet-adapter-react';
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
// import {getAssociatedTokenAddress} from "@solana/spl-token";
import AccountsDrawer from "@/components/AccountsDrawer";

const Navbar = () => {
  const { connected, connecting, publicKey: userPubKey } = useWallet();


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