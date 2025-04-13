"use client";
import { Button, CloseButton, Dialog } from "@chakra-ui/react";
import CreateAccountForm from "@/app/CreateAccountForm";

const CreateAccountDialog = () => {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="solid" size="sm" className="w-full">
          Create Sub Account
        </Button>
      </Dialog.Trigger>
      <Dialog.Positioner>
        <Dialog.Backdrop />
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Create Sub Account</Dialog.Title>
          </Dialog.Header>
          <CreateAccountForm />
          <Dialog.CloseTrigger asChild>
            <CloseButton size="sm" />
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default CreateAccountDialog;
