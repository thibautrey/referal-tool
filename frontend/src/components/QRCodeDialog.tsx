import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, QrCode } from "lucide-react";
import QRCode from "react-qr-code";
import { useAppTranslation } from "@/i18n";

interface QRCodeDialogProps {
  url: string;
}

export const QRCodeDialog = ({ url }: QRCodeDialogProps) => {
  const { t } = useAppTranslation();

  const downloadQRCode = () => {
    const svg = document.getElementById("qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const base64Data = btoa(svgData);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = "qrcode.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };

    img.src = "data:image/svg+xml;base64," + base64Data;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8" aria-label={t("links.form.preview.qr.title")}>
          <QrCode className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("links.form.preview.qr.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center p-4 bg-white rounded">
            <QRCode id="qr-code" value={url} size={200} />
          </div>
          <Button variant="outline" onClick={downloadQRCode} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            {t("links.form.preview.qr.download")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
