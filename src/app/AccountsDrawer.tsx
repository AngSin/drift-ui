"use client";
import {
  Button,
  CloseButton,
  Drawer,
  Portal,
  Card,
  Stack,
} from "@chakra-ui/react";
import useDriftStore from "@/store/driftStore";
import { shortenAddress } from "@/utils/strings";
import { convertToNumber, QUOTE_PRECISION } from "@drift-labs/sdk-browser";
import { useEffect, useState } from "react";
import { connection } from "@/utils/constants";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import TransferDialog from "@/app/TransferDialog";

const AccountsDrawer = () => {
  const [walletBalance, setWalletBalance] = useState<string>("0.0");
  const { selectedUser, users, selectUser } = useDriftStore();
  const fetchBalance = async () => {
    if (selectedUser) {
      const lamports = await connection.getBalance(
        selectedUser.account.authority,
      );
      const solBalance = (lamports / LAMPORTS_PER_SOL).toFixed(2);
      setWalletBalance(solBalance);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [selectedUser]);

  if (!selectedUser) {
    return null;
  }

  return (
    <Drawer.Root>
      <Drawer.Trigger asChild>
        <Button variant="subtle" size="lg" margin="1" padding={6}>
          {Buffer.from(selectedUser.account.name).toString()}
        </Button>
      </Drawer.Trigger>
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <br />
            <Drawer.Header>
              <Drawer.Title>
                {Buffer.from(selectedUser.account.name).toString()}
              </Drawer.Title>
              <Drawer.Description>
                {shortenAddress(
                  selectedUser.driftUser.getUserAccountPublicKey().toString(),
                )}
              </Drawer.Description>
            </Drawer.Header>
            <Drawer.Body>
              <div className="flex justify-between">
                <div>
                  <div>
                    $
                    {convertToNumber(
                      selectedUser.driftUser.getTotalAssetValue(),
                      QUOTE_PRECISION,
                    ).toFixed(2)}
                  </div>
                  <div>Subacct. Value</div>
                </div>
                <div>
                  <div>{walletBalance} SOL</div>
                  <div>Wallet Balance</div>
                </div>
              </div>
              <TransferDialog />
              <Stack gap="4" direction="column" wrap="wrap" marginTop={2}>
                {users.map((user) => (
                  <Card.Root
                    key={user.account.subAccountId}
                    cursor="pointer"
                    onClick={() => selectUser(user.account.subAccountId)}
                  >
                    <Card.Body>
                      <Card.Title>
                        {Buffer.from(user.account.name).toString()}
                      </Card.Title>
                      <Card.Description>
                        Sub Account ID: {user.account.subAccountId}
                      </Card.Description>
                      <Card.Description>
                        Sub Account Address:{" "}
                        {shortenAddress(
                          user.driftUser.getUserAccountPublicKey().toString(),
                        )}
                      </Card.Description>
                      <Card.Description>
                        $
                        {convertToNumber(
                          user.driftUser.getTotalAssetValue(),
                          QUOTE_PRECISION,
                        ).toFixed(2)}
                      </Card.Description>
                    </Card.Body>
                  </Card.Root>
                ))}
              </Stack>
            </Drawer.Body>
            <Drawer.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
};

export default AccountsDrawer;
