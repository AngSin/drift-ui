'use client';

import React from 'react';
import {Box, Stack, Tabs,} from '@chakra-ui/react';
import {OrderType,} from '@drift-labs/sdk-browser';
import TradingTabs from "@/app/TradingTabs";

const TradingPanel = () => {
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
