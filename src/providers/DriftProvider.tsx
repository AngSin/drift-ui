"use client";

import useDriftStore from "@/store/driftStore";
import {useAnchorWallet} from "@solana/wallet-adapter-react";
import {PropsWithChildren, useEffect, useRef} from "react";

const DriftProvider = (props: PropsWithChildren) => {
  const wallet = useAnchorWallet();

  const { initDriftClient, resetDriftClient } = useDriftStore();

  const alreadyInitialized = useRef(false);

  useEffect(() => {
    if (!alreadyInitialized.current && wallet) {
      alreadyInitialized.current = true;
      initDriftClient(wallet);
    }

    return resetDriftClient;
  }, [wallet]);

  return (
    <>
      {props.children}
    </>
  );
};

export default DriftProvider;