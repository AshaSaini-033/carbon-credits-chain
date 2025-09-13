import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, TrendingUp } from "lucide-react";

interface WalletInfo {
  address: string;
  balance: string;
  retired: string;
}

interface TokenBalanceCardProps {
  walletInfo: WalletInfo;
}

export const TokenBalanceCard = ({ walletInfo }: TokenBalanceCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Token Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-primary/5 rounded-lg">
            <p className="text-2xl font-bold text-primary">{walletInfo.balance}</p>
            <p className="text-sm text-muted-foreground">Available BCC</p>
          </div>
          <div className="text-center p-4 bg-destructive/5 rounded-lg">
            <p className="text-2xl font-bold text-destructive">{walletInfo.retired}</p>
            <p className="text-sm text-muted-foreground">Retired BCC</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};