import {Button, CloseButton, Drawer, Portal, Card, Stack} from "@chakra-ui/react";
import useDriftStore from "@/store/driftStore";
import {shortenAddress} from "@/utils/strings";

const AccountsDrawer = () => {
  const { selectedUser, users, selectUser } = useDriftStore();
  if (!selectedUser) {
    return null;
  }

  return (
    <Drawer.Root>
      <Drawer.Trigger asChild>
        <Button variant="outline" size="sm">
          {Buffer.from(selectedUser.account.name).toString()}
        </Button>
      </Drawer.Trigger>
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>{Buffer.from(selectedUser.account.name).toString()}</Drawer.Title>
              <Drawer.Description>{shortenAddress(selectedUser.driftUser.getUserAccountPublicKey().toString())}</Drawer.Description>
            </Drawer.Header>
            <Drawer.Body>
              <Stack gap="4" direction="column" wrap="wrap">
                {users.map((user) => (
                  <Card.Root
                    key={user.account.subAccountId}
                    cursor="pointer"
                    onClick={() => selectUser(user.account.subAccountId)}
                  >
                    <Card.Body>
                      <Card.Title>{Buffer.from(user.account.name).toString()}</Card.Title>
                      <Card.Description>Sub Account ID: {user.account.subAccountId}</Card.Description>
                      <Card.Description>Sub Account Address: {shortenAddress(user.publicKey.toString())}</Card.Description>
                    </Card.Body>
                  </Card.Root>
                ))}
              </Stack>
            </Drawer.Body>
            <Drawer.Footer>
              <Button variant="outline">Cancel</Button>
              <Button>Save</Button>
            </Drawer.Footer>
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