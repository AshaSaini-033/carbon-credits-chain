import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Image, Download, ExternalLink } from "lucide-react";

interface MRVViewerProps {
  packageCid: string;
}

export const MRVViewer = ({ packageCid }: MRVViewerProps) => {
  const mockFiles = [
    { name: "mrv-data.json", type: "json", size: "2.4 KB" },
    { name: "evidence-1.jpg", type: "image", size: "1.2 MB" },
    { name: "evidence-2.jpg", type: "image", size: "1.8 MB" },
    { name: "package-metadata.json", type: "json", size: "856 B" }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold mb-2">IPFS Package Contents</h4>
        <div className="bg-muted p-3 rounded-lg text-sm">
          <p className="font-mono break-all">{packageCid}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {mockFiles.map((file, index) => (
          <div key={index} className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center gap-2">
              {file.type === 'image' ? 
                <Image className="h-4 w-4 text-blue-500" /> : 
                <FileText className="h-4 w-4 text-green-500" />
              }
              <span className="text-sm">{file.name}</span>
              <span className="text-xs text-muted-foreground">({file.size})</span>
            </div>
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" className="w-full">
        <Download className="h-4 w-4 mr-2" />
        Download Full Package
      </Button>
    </div>
  );
};