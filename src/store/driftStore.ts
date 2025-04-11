'use client';

import {create} from 'zustand';
import {WalletAdapterNetwork} from '@solana/wallet-adapter-base';
import {PublicKey} from '@solana/web3.js';
import {AnchorWallet} from "@solana/wallet-adapter-react";
import {
  BulkAccountLoader,
  DriftClient,
  fetchUserAccounts,
  initialize, PerpMarkets,
  User as DriftUser,
  UserAccount,
} from "@drift-labs/sdk-browser";
import driftIDL from '@drift-labs/sdk/src/idl/drift.json';
import {AnchorProvider, Idl, Program} from "@coral-xyz/anchor";
import {connection} from "@/utils/constants";

type User = {
  driftUser: DriftUser;
  account: UserAccount;
};

interface DriftState {
  bulkAccountLoader?: BulkAccountLoader;
  driftClient?: DriftClient;
  selectedUser?: User;
  users: User[];
  initialized: boolean;
  initDriftClient: (wallet: AnchorWallet) => Promise<void>;
  selectUser: (subAccountId: number) => void;
  resetDriftClient: () => void;
  program?: Program;
  getMarketSymbol: (marketIndex: number) => string | undefined;
  positionsUpdatedAt: number;
}

export const ONE_SECOND_INTERVAL = 1_000;

const useDriftStore = create<DriftState>((set, get) => ({
  bulkAccountLoader: undefined,
  driftClient: undefined,
  selectedUser: undefined,
  users: [],
  initialized: false,
  program: undefined,
  positionsUpdatedAt: 0,

  initDriftClient: async (wallet) => {
    console.log("Initializing Drift client...");
    const sdkConfig = initialize({ env: WalletAdapterNetwork.Mainnet });

    const bulkAccountLoader = new BulkAccountLoader(connection, 'confirmed', ONE_SECOND_INTERVAL); // Polls every 1s

    const driftClient = new DriftClient({
      connection,
      wallet,
      programID: new PublicKey(sdkConfig.DRIFT_PROGRAM_ID),
      accountSubscription: {
        type: 'polling',
        accountLoader: bulkAccountLoader,
      },
    });

    await driftClient.subscribe();

    const program = new Program(
      driftIDL as Idl,
      new PublicKey(sdkConfig.DRIFT_PROGRAM_ID),
      new AnchorProvider(connection, wallet, {}),
    );

    // @ts-expect-error program's account prop is slightly different
    const userAccounts = (await fetchUserAccounts(connection, program, wallet.publicKey)).filter(Boolean);

    const users = await Promise.all(
      userAccounts.filter(account => !!account).map(async (account) => {
        const userAccountPublicKey = await driftClient.getUserAccountPublicKey(account.subAccountId, wallet.publicKey);

        const driftUser = new DriftUser({
          driftClient,
          userAccountPublicKey,
          accountSubscription: {
            type: 'polling',
            accountLoader: bulkAccountLoader,
          }
        });

        await driftUser.subscribe();

        return {
          driftUser,
          account,
        };
      })
    );

    set({
      bulkAccountLoader,
      driftClient,
      selectedUser: users[0],
      users,
      program,
      initialized: true,
    });
  },

  resetDriftClient: () => {
    const state = get();
    state.selectedUser?.driftUser.unsubscribe();
    state.driftClient?.unsubscribe();
    set({
      driftClient: undefined,
      selectedUser: undefined,
      initialized: false,
      users: [],
    });
  },

  selectUser: async (subAccountId: number) => {
    const state = get();
    const selectedUser = state.users.find((u) => u.account.subAccountId === subAccountId);
    if (!selectedUser) return;

    set({ selectedUser });
    await state.driftClient?.switchActiveUser(subAccountId);
  },

  getMarketSymbol: (marketIndex: number) => {
    const state = get();
    if (!state.driftClient) return undefined;

    return PerpMarkets[state.driftClient.env].find((m) => m.marketIndex === marketIndex)?.symbol;
  },
}));

export default useDriftStore;