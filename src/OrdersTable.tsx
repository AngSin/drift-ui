import {Table} from "@chakra-ui/react";
import {Order} from "@drift-labs/sdk-browser";
import {formatBigNum, getMarketSymbol} from "@/utils/strings";

type OrdersTableProps = {
  orders: Order[];
  // driftClient: DriftClient;
}

const OrdersTable = ({ orders }: OrdersTableProps) => {
  return (

    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Market</Table.ColumnHeader>
          <Table.ColumnHeader>Type</Table.ColumnHeader>
          <Table.ColumnHeader>Size</Table.ColumnHeader>
          <Table.ColumnHeader>Trigger/Limit</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {orders.map((order, index) => {
          return (
            <Table.Row key={index}>
              <Table.Cell>
                {getMarketSymbol(order.marketIndex)}
              </Table.Cell>
              <Table.Cell>{Object.keys(order.orderType)[0]}</Table.Cell>
              <Table.Cell>{formatBigNum(order.baseAssetAmount, 9)}</Table.Cell>
              <Table.Cell>${formatBigNum(order.triggerPrice,  6)}</Table.Cell>
            </Table.Row>
          )
        })}
      </Table.Body>
    </Table.Root>
  );
};

export default OrdersTable;