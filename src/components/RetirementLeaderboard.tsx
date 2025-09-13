import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Award, Medal } from "lucide-react";

export const RetirementLeaderboard = () => {
  const leaderboard = [
    { address: "0x742d35...C3f", retired: "2,345", rank: 1 },
    { address: "0x8f4A3F...Q2R", retired: "1,892", rank: 2 },
    { address: "0x123abc...789", retired: "1,456", rank: 3 }
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2: return <Award className="h-4 w-4 text-gray-400" />;
      case 3: return <Medal className="h-4 w-4 text-orange-500" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Retirement Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <div key={entry.address} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getRankIcon(entry.rank)}
                <span className="font-mono text-sm">{entry.address}</span>
              </div>
              <span className="font-semibold">{entry.retired} BCC</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};