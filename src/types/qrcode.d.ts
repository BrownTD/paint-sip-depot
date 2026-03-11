declare module "qrcode" {
  export type QRCode = {
    modules: {
      size: number;
      get(row: number, column: number): boolean | number;
    };
  };

  export function create(
    text: string,
    options?: {
      errorCorrectionLevel?: string;
    }
  ): QRCode;
}
