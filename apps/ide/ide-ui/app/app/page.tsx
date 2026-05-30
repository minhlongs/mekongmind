import { BalanceHeader } from "@/components/balance-header";
import { TerminalView } from "@/components/terminal-view";

export default function AppPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <BalanceHeader />
      <TerminalView />
    </div>
  );
}
