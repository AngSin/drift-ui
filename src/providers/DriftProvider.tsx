"use client";

import useDriftStore from "@/store/driftStore";
import {useAnchorWallet} from "@solana/wallet-adapter-react";
import {PropsWithChildren, useEffect} from "react";

const DriftProvider = (props: PropsWithChildren) => {
  const wallet = useAnchorWallet();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { initDriftClient, resetDriftClient, positionsUpdatedAt } = useDriftStore();

  useEffect(() => {
    if (wallet) {
      initDriftClient(wallet);
    }

    return () => {
      resetDriftClient();
    };
  }, [wallet]);

  return (
    <>
      {props.children}
    </>
  );
};

export default DriftProvider;