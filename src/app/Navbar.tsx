"use client";
import {useWallet} from '@solana/wallet-adapter-react';
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
// import {getAssociatedTokenAddress} from "@solana/spl-token";
import AccountsDrawer from "@/app/AccountsDrawer";
import {Box, Link} from "@chakra-ui/react";

const Navbar = () => {
  const { connected, connecting, publicKey: userPubKey } = useWallet();


  return (
    <Box borderWidth={1} borderRadius="lg" p={2} className="flex justify-between bg-gray-950" margin="2">
      <div className="flex justify-start gap-2 items-center m-2">
        <Link href="/">Trade</Link>&nbsp;|&nbsp;
        <Link href="/explore">Explore</Link>
      </div>
      <div className="flex justify-end items-center">
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
    </Box>
  );
};

export default Navbar;