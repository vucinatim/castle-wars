import GameCanvas from "@/components/game-canvas";
import HUD from "@/components/hud";
import DebugPanel from "@/components/debug-panel";
import DebugToggle from "@/components/debug-toggle";

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
