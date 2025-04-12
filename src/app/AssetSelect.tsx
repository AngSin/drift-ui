"use client"

import { Select, createListCollection } from "@chakra-ui/react"
import useDriftStore from "@/store/driftStore";
import {SpotMarketAccount} from "@drift-labs/sdk-browser";
import {useEffect, useState} from "react";

type DepositAssetSelectProps = {
  spotMarketAccount?: SpotMarketAccount;
  setSpotMarketAccount: (account: SpotMarketAccount) => void;
};

const AssetSelect = ({
  spotMarketAccount,
  setSpotMarketAccount
}: DepositAssetSelectProps) => {
  const [assets, setAssets] = useState<SpotMarketAccount[]>([]);
  const { driftClient } = useDriftStore();

  useEffect(() => {
    if (driftClient) {
      setAssets(driftClient.getSpotMarketAccounts());
    }
  }, [driftClient]);

  const assetCollection = createListCollection({
    items: assets.map(asset => ({
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
              onClick={() => setSpotMarketAccount(asset)}
            >
              {asset.value}
              {spotMarketAccount?.marketIndex === asset.key && <Select.ItemIndicator />}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  )
};

export default AssetSelect;
