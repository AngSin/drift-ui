"use client";
import {Button, CloseButton, Dialog} from "@chakra-ui/react"
import DepositForm from "./DepositForm";

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
          <DepositForm />
          <Dialog.CloseTrigger asChild>
            <CloseButton size="sm" />
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default TransferDialog;
