import GameCanvas from "@/components/GameCanvas";
import HUD from "@/components/HUD";
import DebugPanel from "@/components/DebugPanel";
import DebugToggle from "@/components/DebugToggle";

export default function Home() {
  return (
    <main className="relative w-full h-screen overflow-hidden">
      <GameCanvas />
      <HUD />
      <DebugToggle />
      <DebugPanel />
    </main>
  );
}
