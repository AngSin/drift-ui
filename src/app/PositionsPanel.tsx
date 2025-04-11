"use client";
import useDriftStore, { ONE_SECOND_INTERVAL } from "@/store/driftStore";
import {Table, Tabs} from "@chakra-ui/react";
import {BN, convertToNumber} from "@drift-labs/sdk-browser";
import {useEffect, useState} from "react";

const PositionsPanel = () => {
  const { selectedUser, driftClient, getMarketSymbol } = useDriftStore();
  const [fetchedAt, setFetchedAt] = useState<Date>()
  const positions = selectedUser?.driftUser.getActivePerpPositions();

  useEffect(() => {
    const interval = setInterval(() => {
      setFetchedAt(new Date());
    }, ONE_SECOND_INTERVAL);
    return () => clearInterval(interval);
  }, [selectedUser]);

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
          <div className="w-full flex justify-end text-gray-500">
            Last update at: {fetchedAt?.toLocaleString()}
          </div>
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
                    <Table.Cell>{convertToNumber(position.baseAssetAmount, new BN(10).pow(new BN(9)))}</Table.Cell>
                    <Table.Cell>${convertToNumber(driftClient.getUser().getUnrealizedPNL(false, position.marketIndex),  new BN(10).pow(new BN(6)))}</Table.Cell>
                    <Table.Cell>${convertToNumber(driftClient.getOracleDataForPerpMarket(position.marketIndex).price, new BN(10).pow(new BN(6)))}</Table.Cell>
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