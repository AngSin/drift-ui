'use client';

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, Box, Button, createListCollection, Heading, Input, Select, Spinner, Stack, Text} from '@chakra-ui/react';
import {Keypair, PublicKey} from '@solana/web3.js';
import {
  BulkAccountLoader,
  DriftClient,
  initialize,
  User as DriftUserInternal,
  UserAccount,
} from '@drift-labs/sdk-browser';
import {Wallet} from '@coral-xyz/anchor';
import {connection, SLOW_POLLING_INTERVAL} from '@/utils/constants';
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";

export type ExploreUser = {
  driftUser: DriftUserInternal;
  account: UserAccount;
};

const dummyKeypair = Keypair.generate();

const ExplorePage = () => {
  const [inputAddress, setInputAddress] = useState('');
  const [targetAddress, setTargetAddress] = useState<PublicKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exploreUsers, setExploreUsers] = useState<ExploreUser[]>([]);
  const [selectedExploreUser, setSelectedExploreUser] = useState<ExploreUser | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const bulkAccountLoaderRef = useRef<BulkAccountLoader | null>(null);
  const driftClientRef = useRef<DriftClient | null>(null);
  const userRefs = useRef<DriftUserInternal[]>([]);
  const eventListenersRef = useRef<{ off: () => void }[]>([]);

  const cleanupSubscriptions = useCallback(() => {
    eventListenersRef.current.forEach(listener => listener.off());
    eventListenersRef.current = [];
    userRefs.current.forEach(user => {
      user.unsubscribe().catch(e => console.error("Error unsubscribing explore DriftUser:", e));
    });
    userRefs.current = [];
    if (bulkAccountLoaderRef.current) {
      setTimeout(() => {
        bulkAccountLoaderRef.current?.stopPolling();
        bulkAccountLoaderRef.current = null;
        console.log("ExplorePage BulkAccountLoader stopped.");
      }, 500);
    }
    setExploreUsers([]);
    setSelectedExploreUser(null);
    setLastUpdatedAt(null);
  }, []);

  useEffect(() => {
    return () => {
      cleanupSubscriptions();
    };
  }, [cleanupSubscriptions]);

  const handleSdkUpdate = useCallback(() => {
    setLastUpdatedAt(new Date());
  }, []);

  const handleLoadWallet = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    cleanupSubscriptions();

    let publicKey: PublicKey; // This is the TARGET public key from input
    try {
      publicKey = new PublicKey(inputAddress);
      setTargetAddress(publicKey);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      setError('Invalid Solana address provided.');
      setIsLoading(false);
      return;
    }

    try {
      const sdkConfig = initialize({ env: WalletAdapterNetwork.Mainnet });
      const loader = new BulkAccountLoader(connection, 'confirmed', SLOW_POLLING_INTERVAL);
      bulkAccountLoaderRef.current = loader;

      const dummyWallet: Wallet = {
        publicKey,
        signTransaction: async (tx) => tx,
        signAllTransactions: async (txs) => txs,
        payer: dummyKeypair,
      };

      const client = new DriftClient({
        connection,
        wallet: dummyWallet,
        programID: new PublicKey(sdkConfig.DRIFT_PROGRAM_ID),
        accountSubscription: { type: 'polling', accountLoader: loader },
        opts: { commitment: 'confirmed' }
      });
      await client.subscribe();
      driftClientRef.current = client;

      const clientEmitter = client.eventEmitter;
      if (clientEmitter && typeof clientEmitter.on === 'function') {
        clientEmitter.on('update', handleSdkUpdate);
        eventListenersRef.current.push({ off: () => clientEmitter.off('update', handleSdkUpdate) });
      }

      const userAccounts = await client.getUserAccountsForAuthority(publicKey);

      if (userAccounts.length === 0) {
        setError(`No Drift subaccounts found for wallet ${publicKey.toBase58()}`);
        setIsLoading(false);
        return;
      }

      const usersPromises = userAccounts.filter(account => !!account).map(async (account) => {
        const userAccountPublicKey = await client.getUserAccountPublicKey(account.subAccountId, publicKey);

        const driftUser = new DriftUserInternal({
          driftClient: client,
          userAccountPublicKey: userAccountPublicKey,
          accountSubscription: {
            type: 'polling',
            accountLoader: loader,
          },
        });

        const userEmitter = driftUser.eventEmitter;
        if (userEmitter && typeof userEmitter.on === 'function') {
          userEmitter.on('update', handleSdkUpdate);
          eventListenersRef.current.push({ off: () => userEmitter.off('update', handleSdkUpdate) });
        }

        try {
          await driftUser.subscribe();
          console.log(`Subscribed to DriftUser for subAcc ${account.subAccountId}`);
          userRefs.current.push(driftUser);
          return { driftUser, account };
        } catch (subscribeError) {
          console.error(`Failed to subscribe DriftUser for subAcc ${account.subAccountId} at ${userAccountPublicKey.toBase58()}:`, subscribeError);
          return null;
        }
      });

      const loadedUsersResults = await Promise.all(usersPromises);
      const loadedUsers = loadedUsersResults.filter(user => user !== null) as ExploreUser[];

      if (loadedUsers.length === 0 && userAccounts.length > 0) {
        console.error("All DriftUser subscriptions failed.");
        setError(`Failed to subscribe to any subaccounts for wallet ${publicKey.toBase58()}. Check RPC or program state.`);
        cleanupSubscriptions();
        setIsLoading(false);
        return;
      }

      setExploreUsers(loadedUsers);
      setSelectedExploreUser(loadedUsers[0] || null);
      setLastUpdatedAt(new Date());
      setIsLoading(false);

    } catch (err) {
      console.error("Error loading wallet data:", err);
      setError(`Failed to load data: ${(err as Error)?.message || 'Unknown error'}`);
      cleanupSubscriptions();
    } finally {
      setIsLoading(false);
    }
  }, [inputAddress, cleanupSubscriptions, handleSdkUpdate]);


  const userSubAccountCollection = createListCollection({
    items: exploreUsers.filter(u => u.account).map(user => ({
      ...user,
      key: user.account.subAccountId.toString(),
      value: Buffer.from(user.account.name).toString(),
    }))
  });


  return (
    <Stack gap="4" direction="column" wrap="wrap" marginTop={2} align="stretch">
      <Heading size="lg">Explore Wallet</Heading>
      <Text>Enter a Solana wallet address to view its Drift subaccounts and positions (read-only).</Text>
      <Box>
        <Text as="label" mb={1} display="block" fontWeight="medium">Wallet Address</Text>
        <Input id="walletAddress" placeholder="Enter Solana wallet address (e.g., So11...)" value={inputAddress} onChange={(e) => { setInputAddress(e.target.value); if (error) setError(null); if (e.target.value === '') { cleanupSubscriptions(); setTargetAddress(null); } }} disabled={isLoading}/>
        {error && !isLoading && (<Text color="red.500" fontSize="sm" mt={1}>{error}</Text>)}
      </Box>

      <Button
        onClick={handleLoadWallet}
        loading={isLoading}
        disabled={!inputAddress || isLoading}
        colorScheme="teal"
      >
        {isLoading ? 'Loading...' : 'Load Wallet Data'}
      </Button>

      {isLoading && <Box display="flex" alignItems="center"><Spinner size="sm" mr={2}/>Loading data...</Box>}


      {targetAddress && !isLoading && exploreUsers.length > 0 && (
        <Box w="full">
          <Heading size="md" mt={4} mb={2}>Viewing: {targetAddress.toBase58()}</Heading>
          <Select.Root collection={userSubAccountCollection}>
            <Select.Label>Select Subaccount:</Select.Label>
            <Select.Control><Select.Trigger><Select.ValueText placeholder={Buffer.from(selectedExploreUser?.account.name || []).toString()} /></Select.Trigger></Select.Control>
            <Select.Positioner><Select.Content>
              {userSubAccountCollection.items.map((item) => (
                <Select.Item key={item.key} item={item} onClick={() => setSelectedExploreUser(item)}>{item.value}<Select.ItemIndicator /></Select.Item>
              ))}
            </Select.Content></Select.Positioner>
          </Select.Root>

          {selectedExploreUser ? (
            <>
              <Text fontSize="xs" color="gray.500" mt={2}>Last updated: {lastUpdatedAt?.toLocaleTimeString() ?? 'N/A'}</Text>
            </>
          ) : (
            exploreUsers.length > 0 && <Text>Please select a subaccount.</Text>
          )}
        </Box>
      )}

      {targetAddress && !isLoading && exploreUsers.length === 0 && error && (
        <Alert.Root status='info' mt={4}>
          <Alert.Content>
            <Alert.Title>{error}</Alert.Title>
          </Alert.Content>
        </Alert.Root>
      )}
    </Stack>
  );
};

export default ExplorePage;