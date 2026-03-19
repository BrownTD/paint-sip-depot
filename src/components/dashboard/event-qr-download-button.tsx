"use client";

import { useState } from "react";
import { Download, Loader2, QrCode } from "lucide-react";
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

type EventQrDownloadButtonProps = {
  fileName: string;
  qrCodeImageUrl: string;
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
}: EventQrDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

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

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <QrCode className="mr-1 h-4 w-4" />
          Show QR Code
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl">
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
