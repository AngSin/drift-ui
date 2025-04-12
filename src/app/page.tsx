"use client";
import PositionsPanel from "@/app/PositionsPanel";

export default function Home() {
  return (
    <div className="flex flex-col h-screen w-full">
      <div className="h-1/2 border-b border-gray-200"></div>
      <div className="h-1/2 overflow-auto">
        <PositionsPanel />
      </div>
    </div>
  );
}
