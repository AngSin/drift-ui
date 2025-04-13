"use client";
import {Box, Button, Checkbox, Input} from "@chakra-ui/react";
import {
  BASE_PRECISION,
  BN,
  DriftClient,
  OrderTriggerCondition,
  OrderType,
  PerpMarketAccount,
  PositionDirection
} from "@drift-labs/sdk-browser";
import {useEffect, useState} from "react";
import AssetSelect from "@/app/AssetSelect";
import {capitalize, formatBigNum} from "@/utils/strings";
import {toast} from "react-toastify";

type TradingFormProps = {
  orderType: OrderType;
  direction: PositionDirection;
  driftClient: DriftClient;
}

const TradingForm = ({ orderType, direction, driftClient }: TradingFormProps) => {
  const [size, setSize] = useState<string>('');
  const perpMarketAccounts = driftClient.getPerpMarketAccounts();
  const [perpMarketAccount, setPerpMarketAccount] = useState<PerpMarketAccount>(perpMarketAccounts[0]);
  const [tpPrice, setTpPrice] = useState<string>('');
  const [slPrice, setSlPrice] = useState<string>('');
  const [useTPAndSL, setUseTPAndSL] = useState(false);
  const { price } = driftClient.getOracleDataForPerpMarket(perpMarketAccount?.marketIndex || 0);
  const [humanFriendlyPrice, setHumanFriendlyPrice] = useState<string>(formatBigNum(price, 6));
  const sizeInDollars: `$${string}` = `$${formatBigNum(price.mul(new BN(Number(size) * BASE_PRECISION.toNumber())), 15)}`; // 6 + 9 = 15 (quote + base)

  useEffect(() => {
    setHumanFriendlyPrice(formatBigNum(price, 6));
  }, [price]);

  const trade = async () => {
    try {
      const baseAssetAmount = driftClient.convertToPerpPrecision(Number(size));
      const marketIndex = perpMarketAccount.marketIndex;

      await driftClient.placePerpOrder({
        orderType,
        marketIndex,
        direction,
        baseAssetAmount,
        price: orderType === OrderType.LIMIT
          ? driftClient.convertToPricePrecision(Number(humanFriendlyPrice))
          : undefined,
      });

      if (tpPrice) {
        await driftClient.placePerpOrder({
          orderType: OrderType.TRIGGER_MARKET,
          marketIndex,
          direction: direction === PositionDirection.LONG ? PositionDirection.SHORT : PositionDirection.LONG,
          baseAssetAmount,
          triggerCondition: direction === PositionDirection.LONG ? OrderTriggerCondition.ABOVE : OrderTriggerCondition.BELOW,
          triggerPrice: driftClient.convertToPricePrecision(Number(tpPrice)),
          reduceOnly: true,
        });
      }

      if (slPrice) {
        await driftClient.placePerpOrder({
          orderType: OrderType.TRIGGER_MARKET,
          marketIndex,
          direction: direction === PositionDirection.LONG ? PositionDirection.SHORT : PositionDirection.LONG,
          baseAssetAmount,
          triggerCondition: direction === PositionDirection.LONG ? OrderTriggerCondition.BELOW : OrderTriggerCondition.ABOVE,
          triggerPrice: driftClient.convertToPricePrecision(Number(slPrice)),
          reduceOnly: true,
        });
      }

      toast.success("Order placed successfully");

    } catch (error) {
      console.error(error);
      toast.error("Failed to place order");
    }
  };

  return (
    <Box>
      <Box className="w-full flex">
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
      </Box>
      <Box color="gray.500" pl={2} pb={6}>{sizeInDollars}</Box>
      <Box>{capitalize(Object.keys(orderType)[0])} Price</Box>
      <Input
        value={`$${humanFriendlyPrice}`}
        onChange={(e) => {
          if (orderType === OrderType.LIMIT) {
            const rawValue = e.target.value.replace(/[^0-9.]/g, '');
            const sanitized = rawValue.replace(/^0+([1-9])/, '$1');
            setHumanFriendlyPrice(sanitized);
          }
        }}
      />
      <Checkbox.Root mt={4} checked={useTPAndSL} onCheckedChange={(e) => setUseTPAndSL(!!e.checked)}>
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label>Enable Take Profit / Stop Loss</Checkbox.Label>
      </Checkbox.Root>

      {useTPAndSL && (
        <Box mt={4}>
          <Input
            placeholder="Take Profit Price"
            value={tpPrice}
            onChange={(e) => setTpPrice(e.target.value)}
            mb={2}
          />
          <Input
            placeholder="Stop Loss Price"
            value={slPrice}
            onChange={(e) => setSlPrice(e.target.value)}
          />
        </Box>
      )}

      <Button onClick={trade} mt={2} width="full">
        {Object.keys(direction)[0].toUpperCase()}
      </Button>
    </Box>
  );
};

export default TradingForm;