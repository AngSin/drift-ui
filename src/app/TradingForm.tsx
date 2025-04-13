import { Input } from "@chakra-ui/react";
import {OrderType, PerpMarketAccount, PositionDirection} from "@drift-labs/sdk-browser";
import {useState} from "react";
import AssetSelect from "@/app/AssetSelect";
import useDriftStore from "@/store/driftStore";

type TradingFormProps = {
  orderType: OrderType;
  direction: PositionDirection;
}

const TradingForm = ({ orderType, direction }: TradingFormProps) => {
  const [size, setSize] = useState<string>('');
  const [perpMarketAccount, setPerpMarketAccount] = useState<PerpMarketAccount>();
  const { driftClient } = useDriftStore();

  if (!driftClient) {
    return null;
  }

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
          marketAccount={perpMarketAccount}
          setMarketAccount={setPerpMarketAccount}
          marketAccounts={driftClient.getPerpMarketAccounts()}
        />
      </div>
    </div>
  );
};

export default TradingForm;