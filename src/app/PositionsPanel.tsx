"use client";
import useDriftStore from "@/store/driftStore";
import {Table, Tabs} from "@chakra-ui/react";
import {formatBalance} from "@/utils/strings";

const PositionsPanel = () => {
  const { selectedUser, driftClient, getMarketSymbol } = useDriftStore();
  const positions = selectedUser?.driftUser.getActivePerpPositions();

  return (
    <div>
      <Tabs.Root defaultValue="positions">
        <Tabs.List>
          <Tabs.Trigger value="positions">
            Positions
          </Tabs.Trigger>
          <Tabs.Trigger value="orders">
            Orders
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="positions">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Market</Table.ColumnHeader>
                <Table.ColumnHeader>Size</Table.ColumnHeader>
                <Table.ColumnHeader>PnL</Table.ColumnHeader>
                <Table.ColumnHeader>Market Price</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {driftClient && positions?.map((position) => {
                return (
                  <Table.Row key={position.marketIndex}>
                    <Table.Cell>
                      {getMarketSymbol(position.marketIndex)}
                    </Table.Cell>
                    <Table.Cell>{formatBalance(position.baseAssetAmount, 9)}</Table.Cell>
                    <Table.Cell>${formatBalance(driftClient.getUser().getUnrealizedPNL(true, position.marketIndex),  6)}</Table.Cell>
                    <Table.Cell>${formatBalance(driftClient.getOracleDataForPerpMarket(position.marketIndex).price, 6)}</Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table.Root>
        </Tabs.Content>
        <Tabs.Content value="orders">Manage your projects</Tabs.Content>
      </Tabs.Root>
    </div>
  )
};

export default PositionsPanel;