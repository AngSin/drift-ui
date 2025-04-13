"use client";

import { Select, createListCollection } from "@chakra-ui/react";
import useDriftStore from "@/store/driftStore";

type UserAccountSelectProps = {
  label: string;
};

const UserAccountSelect = ({ label }: UserAccountSelectProps) => {
  const { users, selectUser, selectedUser } = useDriftStore();
  const userCollection = createListCollection({
    items: users.map((user) => ({
      key: user.account.subAccountId,
      value: Buffer.from(user.account.name).toString(),
    })),
  });
  return (
    <Select.Root
      variant="subtle"
      collection={userCollection}
      size="sm"
      width="320px"
      value={selectedUser ? [selectedUser.account.subAccountId.toString()] : []}
    >
      <Select.Label>{label}</Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText
            placeholder={Buffer.from(
              selectedUser?.account.name || [],
            ).toString()}
          />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Select.Positioner>
        <Select.Content>
          {userCollection.items.map((user) => (
            <Select.Item
              item={user}
              key={user.key}
              onClick={() => selectUser(user.key)}
            >
              {user.value}
              {selectedUser?.account.subAccountId === user.key && (
                <Select.ItemIndicator />
              )}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  );
};

export default UserAccountSelect;
