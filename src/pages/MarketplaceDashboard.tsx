import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Coins, TrendingUp, Award, Wallet, Send, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TokenBalanceCard } from "@/components/TokenBalanceCard";
import { RetirementLeaderboard } from "@/components/RetirementLeaderboard";

interface WalletInfo {
  address: string;
  balance: string;
  retired: string;
}

const MarketplaceDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'transfer' | 'retire'>('overview');
  const [walletAddress, setWalletAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [retireAmount, setRetireAmount] = useState("");
  const [retireReason, setRetireReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  
  const { toast } = useToast();

  // Mock wallet connection
  useEffect(() => {
    // Simulate connecting to MetaMask
    const mockWallet = {
      address: "0x742d35Cc6cF32A8D4C8C39432B7BF3Ac5C0a8C3f",
      balance: "1,245.75",
      retired: "456.25"
    };
    setWalletInfo(mockWallet);
    setWalletAddress(mockWallet.address);
  }, []);

  const marketStats = {
    totalSupply: "45,231",
    totalRetired: "12,456",
    circulating: "32,775",
    avgPrice: "$12.50"
  };

  const handleTransfer = async () => {
    if (!transferAmount || !transferTo || !walletAddress) {
      toast({
        title: "Validation Error",
        description: "Please fill in all transfer details",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Transfer Successful",
        description: `Transferred ${transferAmount} BCC tokens to ${transferTo.slice(0, 8)}...`,
      });

      setTransferAmount("");
      setTransferTo("");
      setActiveTab('overview');
      
    } catch (error) {
      toast({
        title: "Transfer Failed",
        description: "Transaction could not be completed",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetirement = async () => {
    if (!retireAmount || !retireReason) {
      toast({
        title: "Validation Error",
        description: "Please specify amount and reason for retirement",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Tokens Retired Successfully",
        description: `${retireAmount} BCC tokens have been permanently retired for: ${retireReason}`,
      });

      // Update wallet info (simulate balance reduction)
      if (walletInfo) {
        const newBalance = (parseFloat(walletInfo.balance.replace(',', '')) - parseFloat(retireAmount)).toString();
        const newRetired = (parseFloat(walletInfo.retired.replace(',', '')) + parseFloat(retireAmount)).toString();
        
        setWalletInfo({
          ...walletInfo,
          balance: newBalance,
          retired: newRetired
        });
      }

      setRetireAmount("");
      setRetireReason("");
      setActiveTab('overview');
      
    } catch (error) {
      toast({
        title: "Retirement Failed",
        description: "Token retirement could not be completed",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const connectWallet = async () => {
    toast({
      title: "Wallet Connected",
      description: "Successfully connected to MetaMask",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-card-foreground">Carbon Marketplace</h1>
                <p className="text-muted-foreground">Trade and retire blue carbon credits</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-accent/10 text-accent border-accent/20">
                💰 Polygon Mumbai
              </Badge>
              {walletInfo ? (
                <Badge variant="outline" className="font-mono text-xs">
                  {walletInfo.address.slice(0, 8)}...{walletInfo.address.slice(-6)}
                </Badge>
              ) : (
                <Button onClick={connectWallet} className="bg-primary hover:bg-primary-dark">
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Market Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Supply</p>
                  <p className="text-2xl font-bold text-primary">{marketStats.totalSupply}</p>
                </div>
                <Coins className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-accent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Circulating</p>
                  <p className="text-2xl font-bold text-accent">{marketStats.circulating}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-destructive">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Retired</p>
                  <p className="text-2xl font-bold text-destructive">{marketStats.totalRetired}</p>
                </div>
                <Flame className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-secondary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Avg Price</p>
                  <p className="text-2xl font-bold text-secondary">{marketStats.avgPrice}</p>
                </div>
                <Award className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mb-8">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'outline'}
            onClick={() => setActiveTab('overview')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Portfolio Overview
          </Button>
          <Button
            variant={activeTab === 'transfer' ? 'default' : 'outline'}
            onClick={() => setActiveTab('transfer')}
            disabled={!walletInfo}
          >
            <Send className="h-4 w-4 mr-2" />
            Transfer Tokens
          </Button>
          <Button
            variant={activeTab === 'retire' ? 'default' : 'outline'}
            onClick={() => setActiveTab('retire')}
            disabled={!walletInfo}
          >
            <Flame className="h-4 w-4 mr-2" />
            Retire Credits
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Token Balance */}
                {walletInfo && <TokenBalanceCard walletInfo={walletInfo} />}

                {/* Recent Transactions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Your latest token activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { type: 'Received', amount: '125.5', from: '0x8f4A...Q2R', date: '2024-01-15', hash: '0xabc123...' },
                        { type: 'Retired', amount: '50.0', reason: 'Corporate Offset Q1 2024', date: '2024-01-10', hash: '0xdef456...' },
                        { type: 'Received', amount: '89.2', from: '0x742d...C3f', date: '2024-01-08', hash: '0x789ghi...' }
                      ].map((tx, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                              tx.type === 'Received' ? 'bg-green-500' : 
                              tx.type === 'Retired' ? 'bg-red-500' : 'bg-blue-500'
                            }`}>
                              {tx.type === 'Received' ? '↓' : tx.type === 'Retired' ? '🔥' : '→'}
                            </div>
                            <div>
                              <p className="font-medium">{tx.type} {tx.amount} BCC</p>
                              <p className="text-sm text-muted-foreground">
                                {tx.from ? `From ${tx.from}` : tx.reason}
                              </p>
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <p>{tx.date}</p>
                            <p className="font-mono text-xs">{tx.hash}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'transfer' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary" />
                    Transfer Blue Carbon Credits
                  </CardTitle>
                  <CardDescription>
                    Send BCC tokens to another wallet address
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Recipient Address</label>
                    <Input
                      placeholder="0x..."
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Amount (BCC)</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                    />
                    {walletInfo && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Available: {walletInfo.balance} BCC
                      </p>
                    )}
                  </div>

                  <Button 
                    className="w-full bg-primary hover:bg-primary-dark"
                    onClick={handleTransfer}
                    disabled={isProcessing || !transferAmount || !transferTo}
                  >
                    {isProcessing ? 'Processing Transfer...' : 'Send Tokens'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === 'retire' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-destructive" />
                    Retire Carbon Credits
                  </CardTitle>
                  <CardDescription>
                    Permanently retire (burn) tokens to offset your carbon footprint
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Amount to Retire (BCC)</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={retireAmount}
                      onChange={(e) => setRetireAmount(e.target.value)}
                    />
                    {walletInfo && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Available: {walletInfo.balance} BCC
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Retirement Reason</label>
                    <Textarea
                      placeholder="e.g., Corporate carbon offsetting for Q1 2024 operations"
                      value={retireReason}
                      onChange={(e) => setRetireReason(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-sm text-destructive font-medium">⚠️ Warning</p>
                    <p className="text-sm text-destructive/80 mt-1">
                      Retired tokens are permanently burned and cannot be recovered. This action is irreversible.
                    </p>
                  </div>

                  <Button 
                    variant="destructive"
                    className="w-full"
                    onClick={handleRetirement}
                    disabled={isProcessing || !retireAmount || !retireReason}
                  >
                    {isProcessing ? 'Processing Retirement...' : `Retire ${retireAmount || '0'} BCC Tokens`}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <RetirementLeaderboard />
            
            {/* Market Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Market Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">24h Volume</span>
                    <span className="font-semibold">2,350 BCC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Projects</span>
                    <span className="font-semibold">127</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Value Locked</span>
                    <span className="font-semibold">$564,875</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Price Chart
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Award className="h-4 w-4 mr-2" />
                  Browse Projects
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Coins className="h-4 w-4 mr-2" />
                  Export Transactions
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceDashboard;