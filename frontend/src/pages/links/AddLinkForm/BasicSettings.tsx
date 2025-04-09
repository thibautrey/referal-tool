import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";
import { generateRandomCode } from "./utils";
import { useRef } from "react";

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
            <span className="text-muted-foreground">{currentDomain}/</span>
            <span className="font-medium">{shortCode}</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div
                className={`flex items-center border rounded-md pr-0 overflow-hidden ${
                  !isShortCodeAvailable ? "border-red-500" : "border-input"
                }`}
              >
                <span className="bg-muted px-3 py-2 text-muted-foreground text-sm">
                  {currentDomain}/
                </span>
                <input
                  ref={shortCodeInputRef}
                  id="shortCode"
                  value={shortCode}
                  onChange={(e) =>
                    onShortCodeChange(e.target.value.toLowerCase())
                  }
                  className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
                  placeholder="code"
                />
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
