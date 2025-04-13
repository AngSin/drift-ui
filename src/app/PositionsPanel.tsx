"use client";
import { User } from "@/store/driftStore";
import { Table, Tabs } from "@chakra-ui/react";
import { formatBigNum, getMarketSymbol } from "@/utils/strings";
import { DriftClient } from "@drift-labs/sdk-browser";
import OrdersTable from "@/OrdersTable";

type PositionsPanelProps = {
  selectedUser: User;
  driftClient: DriftClient;
};

const PositionsPanel = ({ selectedUser, driftClient }: PositionsPanelProps) => {
  const positions = selectedUser.driftUser
    .getActivePerpPositions()
    .filter((position) => position.baseAssetAmount.toString() !== "0");
  const orders = selectedUser.driftUser.getOpenOrders();

  return (
    <div>
      <Tabs.Root defaultValue="positions">
        <Tabs.List>
          <Tabs.Trigger value="positions">
            Positions ({positions.length})
          </Tabs.Trigger>
          <Tabs.Trigger value="orders">Orders ({orders.length})</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="positions">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Market</Table.ColumnHeader>
                <Table.ColumnHeader>Direction</Table.ColumnHeader>
                <Table.ColumnHeader>Size</Table.ColumnHeader>
                <Table.ColumnHeader>PnL</Table.ColumnHeader>
                <Table.ColumnHeader>Market Price</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {driftClient &&
                positions?.map((position, index) => {
                  return (
                    <Table.Row key={index}>
                      <Table.Cell>
                        {getMarketSymbol(position.marketIndex)}
                      </Table.Cell>
                      <Table.Cell>
                        {position.baseAssetAmount.isNeg() ? "SHORT" : "LONG"}
                      </Table.Cell>
                      <Table.Cell>
                        {formatBigNum(position.baseAssetAmount.abs(), 9)}
                      </Table.Cell>
                      <Table.Cell>
                        $
                        {formatBigNum(
                          driftClient
                            .getUser()
                            .getUnrealizedPNL(true, position.marketIndex),
                          6,
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        $
                        {formatBigNum(
                          driftClient.getOracleDataForPerpMarket(
                            position.marketIndex,
                          ).price,
                          6,
                        )}
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
            </Table.Body>
          </Table.Root>
        </Tabs.Content>
        <Tabs.Content value="orders">
          <OrdersTable orders={orders} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

export default PositionsPanel;
