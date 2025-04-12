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
import {connection, POLLING_INTERVAL} from '@/utils/constants';
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";

export type ExploreUser = {
  driftUser: DriftUserInternal; // Use the specific internal type if needed
  account?: UserAccount; // Account might not always be strictly necessary here
};

const dummyKeypair = Keypair.generate();
const dummyWallet: Wallet = {
  publicKey: dummyKeypair.publicKey,
  signTransaction: async (tx) => tx,
  signAllTransactions: async (txs) => txs,
  payer: dummyKeypair, // payer might not be strictly needed by AnchorProvider but good to include
};

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
    console.log('Cleaning up ExplorePage subscriptions...');
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
      const loader = new BulkAccountLoader(connection, 'confirmed', POLLING_INTERVAL);
      bulkAccountLoaderRef.current = loader;


      const client = new DriftClient({
        connection,
        wallet: dummyWallet,
        programID: new PublicKey(sdkConfig.DRIFT_PROGRAM_ID),
        accountSubscription: { type: 'polling', accountLoader: loader },
        opts: { commitment: 'confirmed' }
      });
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

        console.log(`Derived PDA for subAcc ${account.subAccountId}: ${userAccountPublicKey.toBase58()}`);

        const driftUser = new DriftUserInternal({
          driftClient: client,
          userAccountPublicKey: userAccountPublicKey, // Use the manually derived key
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
          // Return the structure expected by ExploreUser type
          return { driftUser, account }; // Keep original account info if needed by ExploreUser type
        } catch (subscribeError) {
          console.error(`Failed to subscribe DriftUser for subAcc ${account.subAccountId} at ${userAccountPublicKey.toBase58()}:`, subscribeError);
          // Decide how to handle subscription errors - skip this user? return null?
          return null; // Return null if subscription fails
        }
      });

      // Filter out any null results from failed subscriptions
      const loadedUsersResults = await Promise.all(usersPromises);
      const loadedUsers = loadedUsersResults.filter(user => user !== null) as ExploreUser[];

      if (loadedUsers.length === 0 && userAccounts.length > 0) {
        // This indicates all subscriptions failed
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
    // Removed tempSignerKeypair.publicKey from dependencies as it's not used
  }, [inputAddress, cleanupSubscriptions, handleSdkUpdate]);


  const handleSelectUser = useCallback((subAccountIdStr: string) => {
    // ... (selection logic remains the same)
    const subAccountId = parseInt(subAccountIdStr, 10);
    // Ensure account exists before accessing subAccountId
    const user = exploreUsers.find(u => u.account?.subAccountId === subAccountId);
    setSelectedExploreUser(user || null);
  }, [exploreUsers]);

  const userSubAccountCollection = createListCollection({
    // Ensure account exists before accessing subAccountId
    items: exploreUsers.filter(u => u.account).map(user => ({
      key: user.account!.subAccountId.toString(),
      value: `Subaccount ${user.account!.subAccountId}`
    }))
  });


  return (
    <Stack gap="4" direction="column" wrap="wrap" marginTop={2} align="stretch">
      {/* ... (Heading, Text, Input Box remain the same) ... */}
      <Heading size="lg">Explore Wallet</Heading>
      <Text>Enter a Solana wallet address to view its Drift subaccounts and positions (read-only).</Text>
      <Box>
        {/* ... Label and Input ... */}
        <Text as="label" mb={1} display="block" fontWeight="medium">Wallet Address</Text>
        <Input id="walletAddress" placeholder="Enter Solana wallet address (e.g., So11...)" value={inputAddress} onChange={(e) => { setInputAddress(e.target.value); if (error) setError(null); if (e.target.value === '') { cleanupSubscriptions(); setTargetAddress(null); } }} disabled={isLoading}/>
        {error && !isLoading && (<Text color="red.500" fontSize="sm" mt={1}>{error}</Text>)}
      </Box>

      {/* Use isLoading prop for Button */}
      <Button
        onClick={handleLoadWallet}
        loading={isLoading} // Use isLoading prop
        disabled={!inputAddress || isLoading}
        colorScheme="teal"
      >
        {isLoading ? 'Loading...' : 'Load Wallet Data'}
      </Button>

      {/* Simplified loading indicator */}
      {isLoading && <Box display="flex" alignItems="center"><Spinner size="sm" mr={2}/>Loading data...</Box>}


      {targetAddress && !isLoading && exploreUsers.length > 0 && (
        <Box w="full">
          {/* ... (Viewing Header, Select component remain the same) ... */}
          <Heading size="md" mt={4} mb={2}>Viewing: {targetAddress.toBase58()}</Heading>
          <Select.Root /* ...props... */ collection={userSubAccountCollection} value={selectedExploreUser?.account ? [selectedExploreUser.account.subAccountId.toString()] : []} onValueChange={(details) => { if (details.value.length > 0) { handleSelectUser(details.value[0]); } }}>
            <Select.Label>Select Subaccount:</Select.Label>
            <Select.Control><Select.Trigger><Select.ValueText placeholder="Select subaccount" /></Select.Trigger></Select.Control>
            <Select.Positioner><Select.Content>
              {userSubAccountCollection.items.map((item) => (<Select.Item key={item.key} item={item}>{item.value}<Select.ItemIndicator /></Select.Item>))}
            </Select.Content></Select.Positioner>
          </Select.Root>

          {/* Display Components */}
          {selectedExploreUser ? (
            <>
              {/* Ensure ExploreUser type matches what ExploreBalances expects */}
              {/*<ExploreBalances selectedExploreUser={selectedExploreUser} lastUpdatedAt={lastUpdatedAt} />*/}
              <Text fontSize="xs" color="gray.500" mt={2}>Last updated: {lastUpdatedAt?.toLocaleTimeString() ?? 'N/A'}</Text>
            </>
          ) : (
            exploreUsers.length > 0 && <Text>Please select a subaccount.</Text>
          )}
        </Box>
      )}

      {/* Use your updated Alert structure */}
      {targetAddress && !isLoading && exploreUsers.length === 0 && error && (
        <Alert.Root status='info' mt={4}>
          {/* <Alert.Indicator />  <- Assuming Indicator might not exist or is optional */}
          <Alert.Content>
            <Alert.Title>{error}</Alert.Title>
            {/* <Alert.Description /> <- Can likely omit empty description */}
          </Alert.Content>
        </Alert.Root>
      )}
    </Stack>
  );
};

export default ExplorePage;