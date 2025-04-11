"use client";
import useDriftStore, { ONE_SECOND_INTERVAL } from "@/store/driftStore";
import {Table} from "@chakra-ui/react";
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
      <div className="w-full flex flex-end font-light">
        Last update at: {fetchedAt?.toLocaleString()}
      </div>
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
                <Table.Cell>{convertToNumber(driftClient.getUser().getUnrealizedPNL(false, position.marketIndex),  new BN(10).pow(new BN(6))).toFixed(2)}</Table.Cell>
                <Table.Cell>{convertToNumber(driftClient.getOracleDataForPerpMarket(position.marketIndex).price, new BN(10).pow(new BN(6))).toFixed(2)}</Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table.Root>
    </div>
  )
};

export default PositionsPanel;