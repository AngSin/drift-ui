'use client';

import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Input,
  Stack,
  Text,
  Tabs,
} from '@chakra-ui/react';
import useDriftStore from '@/store/driftStore';
import {
  BASE_PRECISION,
  BN,
  OrderType,
  PerpMarkets,
  PRICE_PRECISION,
} from '@drift-labs/sdk-browser';
import TradingTabs from "@/app/TradingTabs";

const TradingPanel = () => {
  const { driftClient } = useDriftStore();

  const perpMarkets = useMemo(() => {
    if (!driftClient) return [];
    return PerpMarkets[driftClient.env];
  }, [driftClient]);

  return (
    <Box borderWidth={1} borderRadius="lg" p={4} className="h-full bg-gray-950" margin="2">
      <Stack gap={4}>
        <Tabs.Root defaultValue="market" variant="line" size="sm">
          <Tabs.List>
            <Tabs.Trigger value="market">Market</Tabs.Trigger>
            <Tabs.Trigger value="limit">Limit</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="market">
            <TradingTabs orderType={OrderType.MARKET} />
          </Tabs.Content>
          <Tabs.Content value="limit">
            <TradingTabs orderType={OrderType.LIMIT} />
          </Tabs.Content>
        </Tabs.Root>
      </Stack>
    </Box>
  );
};

export default TradingPanel;
