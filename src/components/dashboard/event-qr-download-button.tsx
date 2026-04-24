"use client";

import { useState } from "react";
import { Download, Loader2, QrCode, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/use-toast";
import { formatDate, formatTime } from "@/lib/utils";

type EventQrDownloadButtonProps = {
  fileName: string;
  qrCodeImageUrl: string;
  organizerName?: string | null;
  eventTitle: string;
  startDateTime: Date;
  locationName: string;
  visibility: "PUBLIC" | "PRIVATE";
  eventCode: string | null;
  liveEventUrl: string;
};

async function svgUrlToPngBlob(qrCodeImageUrl: string) {
  const response = await fetch(qrCodeImageUrl);

  if (!response.ok) {
    throw new Error("Failed to download QR code");
  }

  const svgBlob = await response.blob();
  const objectUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not render QR code"));
      img.src = objectUrl;
    });

    const viewportSize = Math.max(window.innerWidth, window.innerHeight);
    const exportSize = Math.max(1600, Math.ceil(viewportSize * window.devicePixelRatio));
    const canvas = document.createElement("canvas");
    canvas.width = exportSize;
    canvas.height = exportSize;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas rendering is not available");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, exportSize, exportSize);
    context.drawImage(image, 0, 0, exportSize, exportSize);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Could not create PNG file"));
          return;
        }

        resolve(blob);
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function EventQrDownloadButton({
  fileName,
  qrCodeImageUrl,
  organizerName,
  eventTitle,
  startDateTime,
  locationName,
  visibility,
  eventCode,
  liveEventUrl,
}: EventQrDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";
  const formattedDate = formatDate(startDateTime);
  const formattedTime = formatTime(startDateTime);

  const shareText =
    `${liveEventUrl}\n\n` +
    `Hey! I'm hosting a Paint & Sip on ${formattedDate} at ${formattedTime} at ${locationName} and wanted to personally invite you. ` +
    `I'd love for you to come out and join us - grab your ticket here to secure your spot.` +
    (visibility === "PRIVATE" && eventCode ? ` Enter this event code: ${eventCode}.` : "");

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      const pngBlob = await svgUrlToPngBlob(qrCodeImageUrl);
      const objectUrl = URL.createObjectURL(pngBlob);
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

  const handleShare = async () => {
    if (!canNativeShare) {
      toast({
        title: "Sharing unavailable",
        description: "Native sharing is not supported on this device.",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);

    try {
      await navigator.share({
        text: shareText,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      toast({
        title: "Share failed",
        description: error instanceof Error ? error.message : "Could not open the share menu.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <QrCode className="mr-1 h-4 w-4" />
          Share Event
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl [&>button]:top-5 [&>button]:right-4 [&>button]:h-10 [&>button]:w-10 [&>button]:rounded-full [&>button_svg]:h-5 [&>button_svg]:w-5"
      >
        <SheetHeader className="mx-auto w-full max-w-xl text-center">
          <SheetTitle>Event QR Code</SheetTitle>
          <SheetDescription>
            Scan this code from another device or download a PNG copy.
          </SheetDescription>
        </SheetHeader>

        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-4 pb-8 pt-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border bg-white p-4 shadow-sm">
            <img
              src={qrCodeImageUrl}
              alt="Event QR code"
              className="mx-auto block aspect-square w-full"
            />
          </div>

          <Button onClick={handleDownload} disabled={isDownloading} className="w-full max-w-md">
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading PNG...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download QR Code
              </>
            )}
          </Button>

          <Button
            onClick={handleShare}
            disabled={isSharing || !canNativeShare}
            variant="outline"
            className="w-full max-w-md"
          >
            {isSharing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opening Share Menu...
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
