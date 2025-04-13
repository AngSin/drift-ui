import {Input} from "@chakra-ui/react";
import {DriftClient, OrderType, PerpMarketAccount, PositionDirection} from "@drift-labs/sdk-browser";
import {useEffect, useState} from "react";
import AssetSelect from "@/app/AssetSelect";
import {capitalize, formatBigNum} from "@/utils/strings";

type TradingFormProps = {
  orderType: OrderType;
  direction: PositionDirection;
  driftClient: DriftClient;
}

const TradingForm = ({ orderType, direction, driftClient }: TradingFormProps) => {
  const [size, setSize] = useState<string>('');
  const perpMarketAccounts = driftClient.getPerpMarketAccounts();
  const [perpMarketAccount, setPerpMarketAccount] = useState<PerpMarketAccount>(perpMarketAccounts[0]);
  const { price } = driftClient.getOracleDataForPerpMarket(perpMarketAccount?.marketIndex || 0);
  const [humanFriendlyPrice, setHumanFriendlyPrice] = useState<`$${string}`>(`$${formatBigNum(price, 6)}`);

  useEffect(() => {
    const { price } = driftClient.getOracleDataForPerpMarket(perpMarketAccount?.marketIndex || 0);
    setHumanFriendlyPrice(`$${formatBigNum(price, 6)}`);
  }, [perpMarketAccount?.marketIndex]);

  return (
    <div>
      <div className="w-full flex">
        <Input
          type="number"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="e.g. 0.01"
        />
        <AssetSelect<PerpMarketAccount>
          selectedMarketAccount={perpMarketAccount}
          setMarketAccount={setPerpMarketAccount as (account?: PerpMarketAccount) => void}
          marketAccounts={perpMarketAccounts}
        />
      </div>
      <div>{capitalize(Object.keys(orderType)[0])} Price</div>
      <Input
        value={humanFriendlyPrice}
        onChange={(e) => {
          if (orderType === OrderType.LIMIT) {
            const rawValue = e.target.value.replace(/[^0-9.]/g, '');
            const sanitized = rawValue.replace(/^0+([1-9])/, '$1');
            setHumanFriendlyPrice(`$${sanitized}`);
          }
        }}
      />
    </div>
  );
};

export default TradingForm;