import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Copy } from "lucide-react";
import { toast } from "sonner";
import { generateRandomCode } from "./utils";
import { useRef } from "react";
import { QRCodeDialog } from "@/components/QRCodeDialog";

interface BasicSettingsProps {
  linkName: string;
  baseUrl: string;
  shortCode: string;
  isEditMode: boolean;
  currentDomain: string;
  isShortCodeAvailable: boolean;
  isCheckingShortCode: boolean;
  onLinkNameChange: (value: string) => void;
  onBaseUrlChange: (value: string) => void;
  onShortCodeChange: (value: string) => void;
}

export function BasicSettings({
  linkName,
  baseUrl,
  shortCode,
  isEditMode,
  currentDomain,
  isShortCodeAvailable,
  isCheckingShortCode,
  onLinkNameChange,
  onBaseUrlChange,
  onShortCodeChange,
}: BasicSettingsProps) {
  const shortCodeInputRef = useRef<HTMLInputElement>(null);

  const regenerateShortCode = () => {
    onShortCodeChange(generateRandomCode());
  };

  const copyShortCode = () => {
    navigator.clipboard.writeText(`${currentDomain}/l/${shortCode}`);
    toast.success("Short link copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="linkName">Link Name</Label>
        <Input
          id="linkName"
          placeholder="My Link"
          value={linkName}
          onChange={(e) => onLinkNameChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="baseUrl">Base URL</Label>
        <Input
          id="baseUrl"
          placeholder="https://example.com/ref?id=your-id"
          value={baseUrl}
          onChange={(e) => onBaseUrlChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="shortCode">Short Code</Label>
        {isEditMode ? (
          <div className="flex items-center border rounded-md px-3 py-2 bg-muted">
            <span className="text-muted-foreground">{currentDomain}/l/</span>
            <span className="font-medium">{shortCode}</span>
            <div className="flex ml-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={copyShortCode}
                title="Copy short link"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <QRCodeDialog url={`${currentDomain}/l/${shortCode}`} />
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div
                className={`flex items-center border rounded-md overflow-hidden ${
                  !isShortCodeAvailable ? "border-red-500" : "border-input"
                }`}
              >
                <span className="text-[#166434] bg-[#DCFCE7] px-3 py-2 border-r border-[#166434]/20">
                  {currentDomain}/l/
                </span>
                <input
                  ref={shortCodeInputRef}
                  id="shortCode"
                  value={shortCode}
                  onChange={(e) =>
                    onShortCodeChange(e.target.value.toLowerCase())
                  }
                  className="flex-1 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
                  placeholder="Enter your custom code"
                />
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={copyShortCode}
                    title="Copy short link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <QRCodeDialog url={`${currentDomain}/l/${shortCode}`} />
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={regenerateShortCode}
              title="Generate new code"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        )}
        {!isShortCodeAvailable && (
          <p className="text-sm text-red-500 mt-1">
            This short code is already taken. Please choose a different one.
          </p>
        )}
        {isCheckingShortCode && (
          <p className="text-sm text-muted-foreground mt-1">
            Checking availability...
          </p>
        )}
      </div>
    </div>
  );
}
