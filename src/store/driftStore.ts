'use client';

import {create} from 'zustand';
import {WalletAdapterNetwork} from '@solana/wallet-adapter-base';
import {PublicKey} from '@solana/web3.js';
import {AnchorWallet} from "@solana/wallet-adapter-react";
import {
  BulkAccountLoader,
  DriftClient,
  initialize,
  User as DriftUser,
  UserAccount,
} from "@drift-labs/sdk-browser";
import {connection, FAST_POLLING_INTERVAL} from "@/utils/constants";
import {EventEmitter} from 'events';

export type User = {
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
  lastUpdatedAt?: Date;
}

const useDriftStore = create<DriftState>((set, get) => {
  const handleSdkUpdate = () => {
    set({ lastUpdatedAt: new Date() });
  };

  return {
    bulkAccountLoader: undefined,
    driftClient: undefined,
    selectedUser: undefined,
    users: [],
    initialized: false,
    lastUpdatedAt: undefined, // Initialize the timestamp

    initDriftClient: async (wallet) => {
      console.log("initializing drift client");
      get().resetDriftClient(); // Ensure clean slate

      const sdkConfig = initialize({ env: WalletAdapterNetwork.Mainnet });

      const bulkAccountLoader = new BulkAccountLoader(connection, 'confirmed', FAST_POLLING_INTERVAL);

      const driftClient = new DriftClient({
        connection,
        wallet,
        programID: new PublicKey(sdkConfig.DRIFT_PROGRAM_ID),
        accountSubscription: {
          type: 'polling',
          accountLoader: bulkAccountLoader,
        },
      });

      (driftClient.eventEmitter as EventEmitter)?.on('update', handleSdkUpdate);


      await driftClient.subscribe();

      const userAccounts = await driftClient.getUserAccountsForAuthority(wallet.publicKey);

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

          driftUser.eventEmitter.on('update', handleSdkUpdate);

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
        initialized: true,
        lastUpdatedAt: new Date(), // Set initial timestamp
      });
    },

    resetDriftClient: () => {
      const state = get();

      if (state.driftClient) {
        (state.driftClient.eventEmitter as EventEmitter)?.off('update', handleSdkUpdate);
      }
      state.users.forEach(user => {
        (user.driftUser.eventEmitter as EventEmitter)?.off('update', handleSdkUpdate);
      });

      state.users.forEach(user => {
        user.driftUser.unsubscribe().catch(e => console.error("Error unsubscribing DriftUser:", e));
      });
      state.driftClient?.unsubscribe().catch(e => console.error("Error unsubscribing DriftClient:", e));

      state.bulkAccountLoader?.stopPolling();

      set({
        driftClient: undefined,
        selectedUser: undefined,
        initialized: false,
        users: [],
        bulkAccountLoader: undefined,
        lastUpdatedAt: undefined, // Reset timestamp
      });
    },

    selectUser: async (subAccountId: number) => {
      const state = get();
      const selectedUser = state.users.find((u) => u.account.subAccountId === subAccountId);
      if (!selectedUser || selectedUser === state.selectedUser) return; // Avoid unnecessary updates

      set({ selectedUser });
      await state.driftClient?.switchActiveUser(subAccountId);
    },
  };
});

export default useDriftStore;