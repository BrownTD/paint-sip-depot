type ShippoAddress = {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
};

type ShippoRate = {
  object_id: string;
  amount: string;
  currency: string;
  provider: string;
  carrier_account?: string;
  servicelevel?: {
    name?: string;
    token?: string;
    display_name?: string;
  };
};

type ShippoShipmentResponse = {
  object_id: string;
  rates?: ShippoRate[];
  messages?: unknown[];
};

type ShippoOrderResponse = {
  object_id: string;
  order_status?: string;
};

export type ShippoRateQuote = {
  shipmentId: string;
  rateId: string;
  amountCents: number;
  provider: string;
  service: string;
  carrierAccount?: string;
  parcelSummary: string;
  shipmentCount: number;
};

type RateShipmentInput = {
  toAddress: ShippoAddress;
  quantity: number;
  metadata: string;
};

type ShippoLineItem = {
  quantity: number;
  sku?: string | null;
  title: string;
  total_price: string;
  currency: string;
  weight?: string;
  weight_unit?: string;
};

type CreateShippoOrderInput = {
  toAddress: ShippoAddress;
  lineItems: ShippoLineItem[];
  placedAt: Date;
  orderNumber: string;
  subtotalCents: number;
  totalCents: number;
  shippingAmountCents: number;
  shippingMethod?: string | null;
  notes?: string | null;
  currency?: string;
};

const SHIPPO_API_BASE_URL = "https://api.goshippo.com";
const DEFAULT_FROM_ADDRESS: ShippoAddress = {
  name: "Paint & Sip Depot",
  company: "Paint & Sip Depot",
  street1: "9600 Two Notch Rd",
  street2: "Suite 5 #1348",
  city: "Columbia",
  state: "SC",
  zip: "29223",
  country: "US",
  phone: "8039384775",
  email: "info@paintsipdepot.com",
};

function getShippoToken() {
  return (
    process.env.SHIPPO_TOKEN ||
    process.env.SHIPPO_API_KEY ||
    process.env.SHIPPO_LIVE_KEY ||
    process.env.SHIPPO_TEST_KEY ||
    ""
  );
}

function getFromAddress(): ShippoAddress {
  return {
    name: process.env.SHIPPO_FROM_NAME || DEFAULT_FROM_ADDRESS.name,
    company: process.env.SHIPPO_FROM_COMPANY || DEFAULT_FROM_ADDRESS.company,
    street1: process.env.SHIPPO_FROM_STREET1 || DEFAULT_FROM_ADDRESS.street1,
    street2: process.env.SHIPPO_FROM_STREET2 || DEFAULT_FROM_ADDRESS.street2,
    city: process.env.SHIPPO_FROM_CITY || DEFAULT_FROM_ADDRESS.city,
    state: process.env.SHIPPO_FROM_STATE || DEFAULT_FROM_ADDRESS.state,
    zip: process.env.SHIPPO_FROM_ZIP || DEFAULT_FROM_ADDRESS.zip,
    country: process.env.SHIPPO_FROM_COUNTRY || DEFAULT_FROM_ADDRESS.country,
    phone: process.env.SHIPPO_FROM_PHONE || DEFAULT_FROM_ADDRESS.phone,
    email: process.env.SHIPPO_FROM_EMAIL || DEFAULT_FROM_ADDRESS.email,
  };
}

function dollarsFromCents(cents: number) {
  return (cents / 100).toFixed(2);
}

function centsFromDollars(value: string) {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

const KIT_WEIGHT_LB = 2;
const MAX_KITS_PER_SHIPMENT = 25;

function getKitBoxTier(quantity: number) {
  if (quantity <= 1) return { length: "16", width: "12", height: "3" };
  if (quantity <= 4) return { length: "16", width: "12", height: "4" };
  if (quantity <= 8) return { length: "16", width: "12", height: "6" };
  if (quantity <= 14) return { length: "18", width: "16", height: "8" };
  if (quantity <= 20) return { length: "18", width: "16", height: "10" };
  return { length: "18", width: "16", height: "12" };
}

function splitQuantityIntoShipments(quantity: number) {
  const safeQuantity = Math.max(1, Math.ceil(quantity));
  const shipments: number[] = [];
  let remaining = safeQuantity;

  while (remaining > 0) {
    const nextQuantity = Math.min(MAX_KITS_PER_SHIPMENT, remaining);
    shipments.push(nextQuantity);
    remaining -= nextQuantity;
  }

  return shipments;
}

function getKitParcel(quantity: number) {
  const tier = getKitBoxTier(quantity);

  return {
    ...tier,
    distance_unit: "in",
    weight: String(quantity * KIT_WEIGHT_LB),
    mass_unit: "lb",
    metadata: `${quantity} kit${quantity === 1 ? "" : "s"}`,
  };
}

export function getKitParcelSummary(quantity: number) {
  return splitQuantityIntoShipments(quantity)
    .map((shipmentQuantity, index) => {
      const box = getKitBoxTier(shipmentQuantity);
      return `Shipment ${index + 1}: ${shipmentQuantity} kit${
        shipmentQuantity === 1 ? "" : "s"
      }, ${box.length}x${box.width}x${box.height} in, ${shipmentQuantity * KIT_WEIGHT_LB} lb`;
    })
    .join("; ");
}

function shouldRequestDropoffQrCode() {
  return process.env.SHIPPO_QR_CODE_REQUESTED !== "false";
}

function shippoReference(value: string) {
  return value.slice(0, 50);
}

function shippoMetadata(value: string) {
  return value.slice(0, 100);
}

async function shippoRequest<T>(path: string, init: RequestInit = {}) {
  const token = getShippoToken();
  if (!token) {
    throw new Error("Shippo is not configured. Add SHIPPO_TEST_KEY locally and SHIPPO_LIVE_KEY in production.");
  }

  const response = await fetch(`${SHIPPO_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `ShippoToken ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Shippo request failed (${response.status}): ${details || response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function getShippoUspsRateQuote(input: RateShipmentInput): Promise<ShippoRateQuote> {
  const shipmentQuantities = splitQuantityIntoShipments(input.quantity);
  const preferredService = process.env.SHIPPO_USPS_SERVICELEVEL_TOKEN || "usps_ground_advantage";
  const quotes = await Promise.all(
    shipmentQuantities.map(async (shipmentQuantity, index) => {
      const shipment = await shippoRequest<ShippoShipmentResponse>("/shipments/", {
        method: "POST",
        body: JSON.stringify({
          address_from: getFromAddress(),
          address_to: input.toAddress,
          parcels: [getKitParcel(shipmentQuantity)],
          metadata: shippoMetadata(`${input.metadata}; ${getKitParcelSummary(shipmentQuantity)}`),
          extra: {
            qr_code_requested: shouldRequestDropoffQrCode(),
            reference_1: shippoReference("Paint & Sip Depot"),
            reference_2: shippoReference(`${input.metadata}; ${index + 1}/${shipmentQuantities.length}`),
          },
          carrier_accounts: process.env.SHIPPO_USPS_CARRIER_ACCOUNT_ID
            ? [process.env.SHIPPO_USPS_CARRIER_ACCOUNT_ID]
            : undefined,
          async: false,
        }),
      });

      const uspsRates = (shipment.rates ?? []).filter((rate) => rate.provider.toLowerCase() === "usps");
      const preferredRate = uspsRates.find((rate) => rate.servicelevel?.token === preferredService);
      const cheapestRate = [...uspsRates].sort((a, b) => centsFromDollars(a.amount) - centsFromDollars(b.amount))[0];
      const rate = preferredRate ?? cheapestRate;

      if (!rate) {
        throw new Error("No USPS Shippo rates were returned for this shipping address.");
      }

      return {
        shipmentId: shipment.object_id,
        rateId: rate.object_id,
        amountCents: centsFromDollars(rate.amount),
        provider: rate.provider,
        service: rate.servicelevel?.display_name || rate.servicelevel?.name || rate.servicelevel?.token || "USPS",
        carrierAccount: rate.carrier_account,
      };
    }),
  );

  const firstQuote = quotes[0];
  if (!firstQuote) {
    throw new Error("No USPS Shippo rates were returned for this shipping address.");
  }

  const shipmentCount = quotes.length;
  const service = shipmentCount > 1 ? `${firstQuote.service} (${shipmentCount} shipments)` : firstQuote.service;

  return {
    shipmentId: quotes.map((quote) => quote.shipmentId).join(","),
    rateId: quotes.map((quote) => quote.rateId).join(","),
    amountCents: quotes.reduce((sum, quote) => sum + quote.amountCents, 0),
    provider: firstQuote.provider,
    service,
    carrierAccount: firstQuote.carrierAccount,
    parcelSummary: getKitParcelSummary(input.quantity),
    shipmentCount,
  };
}

export async function createShippoOrder(input: CreateShippoOrderInput) {
  const response = await shippoRequest<ShippoOrderResponse>("/orders/", {
    method: "POST",
    body: JSON.stringify({
      to_address: input.toAddress,
      from_address: getFromAddress(),
      line_items: input.lineItems,
      placed_at: input.placedAt.toISOString(),
      order_number: input.orderNumber,
      order_status: "PAID",
      shipping_cost: dollarsFromCents(input.shippingAmountCents),
      shipping_cost_currency: input.currency?.toUpperCase() || "USD",
      shipping_method: input.shippingMethod || "USPS",
      notes: input.notes || undefined,
      subtotal_price: dollarsFromCents(input.subtotalCents),
      total_price: dollarsFromCents(input.totalCents),
      total_tax: "0.00",
      currency: input.currency?.toUpperCase() || "USD",
      weight: String(
        input.lineItems.reduce((sum, item) => {
          const weight = Number.parseFloat(item.weight ?? "0");
          return sum + (Number.isFinite(weight) ? weight * item.quantity : 0);
        }, 0) || KIT_WEIGHT_LB,
      ),
      weight_unit: "lb",
    }),
  });

  return {
    shippoOrderId: response.object_id,
    shippoOrderStatus: response.order_status ?? "PAID",
  };
}

export function buildShippoShopAddress(input: {
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingPhone?: string | null;
  customerEmail?: string | null;
}): ShippoAddress {
  return {
    name: input.shippingName,
    street1: input.shippingAddress,
    city: input.shippingCity,
    state: input.shippingState,
    zip: input.shippingZip,
    country: "US",
    phone: input.shippingPhone || undefined,
    email: input.customerEmail || undefined,
  };
}

export function buildShippoEventHostAddress(input: {
  shippingRecipientName?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingZip?: string | null;
  hostEmail?: string | null;
}) {
  if (
    !input.shippingRecipientName ||
    !input.shippingAddress ||
    !input.shippingCity ||
    !input.shippingState ||
    !input.shippingZip
  ) {
    throw new Error("This event is missing the host shipping address needed for Shippo rates.");
  }

  return {
    name: input.shippingRecipientName,
    street1: input.shippingAddress,
    city: input.shippingCity,
    state: input.shippingState,
    zip: input.shippingZip,
    country: "US",
    email: input.hostEmail || undefined,
  } satisfies ShippoAddress;
}
