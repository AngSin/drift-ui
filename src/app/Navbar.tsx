"use client";
import {useWallet} from '@solana/wallet-adapter-react';
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
// import {getAssociatedTokenAddress} from "@solana/spl-token";
import AccountsDrawer from "@/app/AccountsDrawer";
import {Link} from "@chakra-ui/react";

const Navbar = () => {
  const { connected, connecting, publicKey: userPubKey } = useWallet();


  return (
    <div className="flex justify-between w-full">
      <div className="flex justify-start gap-2">
        <Link href="/">Trade</Link>
        <Link href="/explore">Explore</Link>
      </div>
      <div className="flex justify-end">
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
    </div>
  );
};

export default Navbar;