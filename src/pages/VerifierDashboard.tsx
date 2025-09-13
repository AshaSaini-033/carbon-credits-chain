import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, XCircle, Eye, FileText, MapPin, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MRVViewer } from "@/components/MRVViewer";

interface MRVSubmission {
  id: number;
  projectId: number;
  projectName: string;
  ownerAddress: string;
  carbonTonnes: number;
  packageCid: string;
  submittedAt: string;
  status: 'submitted' | 'approved' | 'rejected';
  methodology: string;
}

const VerifierDashboard = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedMRV, setSelectedMRV] = useState<MRVSubmission | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Mock MRV submissions data
  const [mrvSubmissions, setMrvSubmissions] = useState<MRVSubmission[]>([
    {
      id: 1,
      projectId: 1,
      projectName: "Mangrove Restoration Bay Area",
      ownerAddress: "0x742d35Cc6cF32A8D4C8C39432B7BF3Ac5C0a8C3f",
      carbonTonnes: 125.5,
      packageCid: "QmYjvEHe4n2gH8X9Z5k6M7T3F2P8R9Q1S4W6Y8A7C5E9D",
      submittedAt: "2024-01-15T10:30:00Z",
      status: "submitted",
      methodology: "Verified Carbon Standard (VCS)"
    },
    {
      id: 2,
      projectId: 2,
      projectName: "Seagrass Conservation Project",
      ownerAddress: "0x8f4A3F6E2D1C9B5A7E4F8G2H6J9K3L5M8N7P4Q2R",
      carbonTonnes: 89.2,
      packageCid: "QmRtYuIoPAsdfGhJklZxCvBnM123456789QwErTyUiOp",
      submittedAt: "2024-01-10T14:45:00Z",
      status: "submitted",
      methodology: "Blue Carbon Initiative Protocol"
    }
  ]);

  const filteredSubmissions = mrvSubmissions.filter(mrv => mrv.status === activeTab);

  const handleVerification = async (action: 'approve' | 'reject') => {
    if (!selectedMRV || !verificationNotes.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide verification notes",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update local state (in real app, this would be API response)
      setMrvSubmissions(prev => 
        prev.map(mrv => 
          mrv.id === selectedMRV.id 
            ? { ...mrv, status: action === 'approve' ? 'approved' : 'rejected' as any }
            : mrv
        )
      );

      toast({
        title: `MRV ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: action === 'approve' 
          ? `${selectedMRV.carbonTonnes} carbon credits will be minted to ${selectedMRV.ownerAddress.slice(0, 8)}...`
          : "MRV package has been rejected with feedback",
      });

      setSelectedMRV(null);
      setVerificationNotes("");
      
      // Switch to appropriate tab to show result
      setActiveTab(action === 'approve' ? 'approved' : 'rejected');
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process MRV submission",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const stats = {
    pending: mrvSubmissions.filter(m => m.status === 'submitted').length,
    approved: mrvSubmissions.filter(m => m.status === 'approved').length,
    rejected: mrvSubmissions.filter(m => m.status === 'rejected').length,
    totalCarbon: mrvSubmissions.filter(m => m.status === 'approved').reduce((sum, m) => sum + m.carbonTonnes, 0)
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
                <h1 className="text-2xl font-bold text-card-foreground">Verifier Dashboard</h1>
                <p className="text-muted-foreground">Review and verify MRV packages</p>
              </div>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20">
              🔍 Certified Verifier
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Pending Review</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                </div>
                <FileText className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Carbon Verified</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalCarbon.toFixed(1)}t</p>
                </div>
                <MapPin className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8">
          <Button
            variant={activeTab === 'pending' ? 'default' : 'outline'}
            onClick={() => setActiveTab('pending')}
            className="relative"
          >
            <FileText className="h-4 w-4 mr-2" />
            Pending Review
            {stats.pending > 0 && (
              <Badge className="ml-2 bg-orange-500 text-white text-xs px-1 py-0 min-w-[20px] h-5">
                {stats.pending}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'approved' ? 'default' : 'outline'}
            onClick={() => setActiveTab('approved')}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approved ({stats.approved})
          </Button>
          <Button
            variant={activeTab === 'rejected' ? 'default' : 'outline'}
            onClick={() => setActiveTab('rejected')}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rejected ({stats.rejected})
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* MRV Submissions List */}
          <Card>
            <CardHeader>
              <CardTitle className="capitalize">{activeTab} MRV Submissions</CardTitle>
              <CardDescription>
                {activeTab === 'pending' && "Review and verify submitted MRV packages"}
                {activeTab === 'approved' && "Successfully verified and approved submissions"}
                {activeTab === 'rejected' && "Submissions that did not meet verification criteria"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No {activeTab} submissions</p>
                  </div>
                ) : (
                  filteredSubmissions.map((mrv) => (
                    <div
                      key={mrv.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedMRV?.id === mrv.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedMRV(mrv)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-card-foreground">{mrv.projectName}</h3>
                        <Badge 
                          variant={
                            mrv.status === 'submitted' ? 'secondary' :
                            mrv.status === 'approved' ? 'default' : 'destructive'
                          }
                          className={
                            mrv.status === 'approved' ? 'bg-green-500 hover:bg-green-600' : ''
                          }
                        >
                          {mrv.carbonTonnes}t CO2
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {new Date(mrv.submittedAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          Project #{mrv.projectId}
                        </div>
                        <p className="text-xs">Owner: {mrv.ownerAddress.slice(0, 10)}...</p>
                      </div>
                      
                      {activeTab === 'pending' && (
                        <Button 
                          size="sm" 
                          className="mt-3 w-full bg-primary hover:bg-primary-dark"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review Package
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* MRV Review Panel */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedMRV ? `Review: ${selectedMRV.projectName}` : 'Select MRV Package'}
              </CardTitle>
              <CardDescription>
                {selectedMRV 
                  ? "Review the MRV evidence and provide verification decision"
                  : "Click on an MRV submission to begin review"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedMRV ? (
                <div className="space-y-6">
                  {/* MRV Details */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Project Information</h4>
                      <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                        <p><span className="font-medium">Project:</span> {selectedMRV.projectName}</p>
                        <p><span className="font-medium">Carbon Claimed:</span> {selectedMRV.carbonTonnes} tonnes CO2</p>
                        <p><span className="font-medium">Methodology:</span> {selectedMRV.methodology}</p>
                        <p><span className="font-medium">Submitted:</span> {new Date(selectedMRV.submittedAt).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* MRV Viewer Component */}
                    <MRVViewer packageCid={selectedMRV.packageCid} />
                  </div>

                  {/* Verification Actions (only for pending) */}
                  {selectedMRV.status === 'submitted' && (
                    <div className="space-y-4 border-t pt-6">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Verification Notes *
                        </label>
                        <Textarea
                          placeholder="Provide detailed verification notes, methodology compliance assessment, and decision rationale..."
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          rows={4}
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleVerification('approve')}
                          disabled={isProcessing || !verificationNotes.trim()}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {isProcessing ? 'Processing...' : 'Approve & Mint Tokens'}
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleVerification('reject')}
                          disabled={isProcessing || !verificationNotes.trim()}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {isProcessing ? 'Processing...' : 'Reject'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Eye className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select an MRV submission from the list to begin review</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VerifierDashboard;