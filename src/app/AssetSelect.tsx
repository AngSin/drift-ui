"use client"

import {createListCollection, Select} from "@chakra-ui/react"
import {PerpMarketAccount, SpotMarketAccount} from "@drift-labs/sdk-browser";

type MarketAccount = SpotMarketAccount | PerpMarketAccount;

type AssetSelectProps<T extends MarketAccount> = {
  marketAccount?: T;
  setMarketAccount: (account?: T) => void;
  marketAccounts: T[];
};

const AssetSelect = <T extends MarketAccount>({
  marketAccount,
  setMarketAccount,
  marketAccounts
}: AssetSelectProps<T>) => {
  const assetCollection = createListCollection({
    items: marketAccounts.map(asset => ({
      ...asset,
      key: asset.marketIndex,
      value: Buffer.from(asset.name).toString()
    })),
  });

  return (
    <Select.Root
      variant="subtle"
      collection={assetCollection}
      size="sm"
      width="320px"
    >
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder={assetCollection.items[0]?.value} />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Select.Positioner>
        <Select.Content>
          {assetCollection.items.map((asset) => (
            <Select.Item
              item={asset}
              key={asset.key}
              onClick={() => setMarketAccount(asset)}
            >
              {asset.value}
              {marketAccount?.marketIndex === asset.key && <Select.ItemIndicator />}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  )
};

export default AssetSelect;
