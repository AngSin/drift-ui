"use client"

import {createListCollection, Select} from "@chakra-ui/react"
import {PerpMarketAccount, SpotMarketAccount} from "@drift-labs/sdk-browser";

type MarketAccount = SpotMarketAccount | PerpMarketAccount;

type AssetSelectProps<T extends MarketAccount> = {
  selectedMarketAccount?: T;
  setMarketAccount: (account?: T) => void;
  marketAccounts: T[];
};

const AssetSelect = <T extends MarketAccount>({
  selectedMarketAccount,
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
      size="md"
      width="320px"
      value={selectedMarketAccount ? [selectedMarketAccount.marketIndex.toString()] : []}
    >
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText>
            {
              assetCollection.items.find(i =>
                i.key.toString() === selectedMarketAccount?.marketIndex.toString()
              )?.value || 'Select Asset'
            }
          </Select.ValueText>
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
              {selectedMarketAccount?.marketIndex === asset.key && <Select.ItemIndicator />}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  )
};

export default AssetSelect;
