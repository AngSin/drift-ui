'use client';

import {create} from 'zustand';
import {WalletAdapterNetwork} from '@solana/wallet-adapter-base';
import {PublicKey} from '@solana/web3.js';
import {AnchorWallet} from "@solana/wallet-adapter-react";
import {BulkAccountLoader, DriftClient, fetchUserAccounts, initialize, User, UserAccount} from "@drift-labs/sdk";
import driftIDL from '@drift-labs/sdk/src/idl/drift.json';
import {AnchorProvider, Idl, Program} from "@coral-xyz/anchor";
import {connection} from "@/utils/constants";

type SelectedUser = {
  driftUser: User;
  account: UserAccount;
};

interface DriftState {
  bulkAccountLoader?: BulkAccountLoader;
  driftClient?: DriftClient;
  selectedUser?: SelectedUser;
  users: {
    publicKey: PublicKey;
    account: UserAccount
  }[];
  initialized: boolean;
  initDriftClient: (wallet: AnchorWallet) => Promise<void>;
  selectUser: (subAccountId: number) => void;
  resetDriftClient: () => void;
  program?: Program;
}

const useDriftStore = create<DriftState>((set) => ({
  bulkAccountLoader: undefined,
  driftClient: undefined,
  selectedUser: undefined,
  users: [],
  initialized: false,
  program: undefined,

  initDriftClient: async (wallet) => {
    console.log("initializing drift client");
    const sdkConfig = initialize({ env: WalletAdapterNetwork.Mainnet });

    const bulkAccountLoader = new BulkAccountLoader(connection, 'confirmed', 1000);

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

    const driftUser = new User({
      driftClient,
      userAccountPublicKey: await driftClient.getUserAccountPublicKey(),
      accountSubscription: {
        type: 'polling',
        accountLoader: bulkAccountLoader,
      },
    });

    await driftUser.subscribe();
    const program = new Program(
      driftIDL as Idl,
      new PublicKey(sdkConfig.DRIFT_PROGRAM_ID),
      new AnchorProvider(connection, wallet, {}),
    );
    // @ts-expect-error program's account prop is slightly different
    const userAccounts = (await fetchUserAccounts(connection, program, wallet.publicKey)).filter(user => !!user);
    const users = await Promise.all(
      userAccounts.map(async (account) => {
        const publicKey = await driftClient.getUserAccountPublicKey(account.subAccountId, wallet.publicKey);
        return {
          publicKey,
          account,
        };
      })
    );
    set({
      bulkAccountLoader,
      driftClient,
      selectedUser: {
        driftUser,
        account: userAccounts[0],
      },
      users,
      program,
      initialized: true
    });
  },

  resetDriftClient: () => {
    const state = useDriftStore.getState();
    state.selectedUser?.driftUser.unsubscribe();
    state.driftClient?.unsubscribe();
    set({ driftClient: undefined, selectedUser: undefined, initialized: false });
  },

  selectUser: async (subAccountId: number) => {
    console.log("selectUser", subAccountId);
    const state = useDriftStore.getState();
    const { driftClient, bulkAccountLoader, program } = state;
    if (driftClient && bulkAccountLoader && program) {
      // unsubscribe the old user
      state.selectedUser?.driftUser.unsubscribe();
      const userAccountPublicKey = await driftClient.getUserAccountPublicKey(subAccountId, driftClient.authority);
      const driftUser = new User({
        driftClient,
        userAccountPublicKey,
        accountSubscription: {
          type: 'polling',
          accountLoader: bulkAccountLoader,
        },
      });

      await driftUser.subscribe();
      // @ts-expect-error program's account prop is slightly different
      const account = (await fetchUserAccounts(connection, program, driftClient.authority)).find(user => user?.subAccountId === subAccountId);
      if (account) {
        set({
          selectedUser: {
            driftUser,
            account
          }
        });
      } else {
        // TODO: error handling
      }
    }
  },
}));

export default useDriftStore;