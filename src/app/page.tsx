"use client";
import PositionsPanel from "@/app/PositionsPanel";
import useDriftStore from "@/store/driftStore";
import TradingPanel from "@/app/TradingPanel";
import { Box } from "@chakra-ui/react";

export default function Home() {
  const { selectedUser, driftClient } = useDriftStore();
  return (
    <div className="flex w-full">
      <Box borderWidth={1} borderRadius="lg" p={4} className="flex flex-col h-screen w-full" margin="2" bg={{ base: 'gray.100', _dark: 'gray.950' }}>
        <div className="h-1/2 border-b border-gray-200"></div>
        <div className="h-1/2 overflow-auto">
          {selectedUser && driftClient && (
            <PositionsPanel selectedUser={selectedUser} driftClient={driftClient} />
          )}
        </div>
      </Box>
      <div className="h-screen">
        <TradingPanel />
      </div>
    </div>
  );
}
