"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

type EventQrDownloadButtonProps = {
  fileName: string;
  qrCodeImageUrl: string;
};

export function EventQrDownloadButton({
  fileName,
  qrCodeImageUrl,
}: EventQrDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      const response = await fetch(qrCodeImageUrl);

      if (!response.ok) {
        throw new Error("Failed to download QR code");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      toast({
        title: "Download failed",
        description:
          error instanceof Error ? error.message : "Could not download the QR code.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleDownload} disabled={isDownloading}>
      {isDownloading ? (
        <>
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          Downloading...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-1" />
          Download QR
        </>
      )}
    </Button>
  );
}
