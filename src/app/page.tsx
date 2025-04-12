"use client";
import PositionsPanel from "@/app/PositionsPanel";
import useDriftStore from "@/store/driftStore";

export default function Home() {
  const { selectedUser, driftClient } = useDriftStore();
  return (
    <div className="flex w-full">
      <div className="flex flex-col h-screen w-full">
        <div className="h-1/2 border-b border-gray-200"></div>
        <div className="h-1/2 overflow-auto">
          {selectedUser && driftClient && (
            <PositionsPanel selectedUser={selectedUser} driftClient={driftClient} />
          )}
        </div>
      </div>
      <div className="h-screen bg-red-300">
        TRADING PANEL
      </div>
    </div>
  );
}
