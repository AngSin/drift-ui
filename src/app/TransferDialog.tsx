"use client";
import { Button, CloseButton, Dialog, Tabs } from "@chakra-ui/react";
import DepositForm from "./DepositForm";
import WithdrawForm from "@/app/WithdrawForm";

const TransferDialog = () => {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="solid" size="sm" className="w-full">
          Deposit/Withdraw
        </Button>
      </Dialog.Trigger>
      <Dialog.Positioner>
        <Dialog.Backdrop />
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Manage Balances</Dialog.Title>
          </Dialog.Header>
          <Tabs.Root defaultValue="deposit">
            <Tabs.List>
              <Tabs.Trigger value="deposit">Deposit</Tabs.Trigger>
              <Tabs.Trigger value="withdraw">Withdraw</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="deposit">
              <DepositForm />
            </Tabs.Content>
            <Tabs.Content value="withdraw">
              <WithdrawForm />
            </Tabs.Content>
          </Tabs.Root>
          <Dialog.CloseTrigger asChild>
            <CloseButton size="sm" />
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default TransferDialog;
