import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { getMetadata } from "@/lib/get-metadata";

interface LinkCardProps {
  url?: string;
  onLoad?: () => void;
  instanceId?: string;
}

export const LinkCard = ({
  url,
  onLoad,
  instanceId = "default",
}: LinkCardProps) => {
  const [title, setTitle] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const requestIdRef = useRef<Record<string, number>>({});
  const lastUrlRef = useRef<Record<string, string | undefined>>({});
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const isValidUrl = (urlString: string): boolean => {
    try {
      let urlToTest = urlString;
      if (
        !urlString.startsWith("http://") &&
        !urlString.startsWith("https://")
      ) {
        urlToTest = `https://${urlString}`;
      }
      new URL(urlToTest);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    // Skip if URL hasn't changed for this instance
    if (url === lastUrlRef.current[instanceId]) {
      return;
    }

    // Reset states if URL changes for this instance
    if (lastUrlRef.current[instanceId] !== undefined) {
      setTitle(null);
      setDescription(null);
      setImageUrl(null);
    }

    lastUrlRef.current[instanceId] = url;
    requestIdRef.current[instanceId] =
      (requestIdRef.current[instanceId] || 0) + 1;
    const currentRequestId = requestIdRef.current[instanceId];

    async function loadMetadata() {
      if (!url || !isValidUrl(url)) {
        setTitle(url || null);
        setDescription(null);
        setImageUrl(null);
        return;
      }

      setIsLoading(true);

      try {
        const metadata = await getMetadata(url);
        // Only update if this is still the current request for this instance and component is mounted
        if (
          requestIdRef.current[instanceId] === currentRequestId &&
          isMounted.current &&
          metadata
        ) {
          setTitle(metadata.title || null);
          setDescription(metadata.description || null);
          setImageUrl(metadata.image || null);
          onLoad?.();
        }
      } finally {
        if (
          requestIdRef.current[instanceId] === currentRequestId &&
          isMounted.current
        ) {
          setIsLoading(false);
        }
      }
    }
    loadMetadata();
  }, [url, onLoad, instanceId]);

  if (!url) {
    return null;
  }

  const fullUrl = url.startsWith("http") ? url : `https://${url}`;

  return (
    <Card className="border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <CardContent className={`p-4 ${isLoading ? "opacity-60" : ""}`}>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={title || "Link preview"}
                  className="w-full h-full object-cover rounded"
                />
              )}
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <p className="font-medium break-all line-clamp-1">
                {title || url}
              </p>
              {description && (
                <p className="text-sm text-muted-foreground break-all line-clamp-2">
                  {description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </a>
    </Card>
  );
};
