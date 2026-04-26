import Stripe from "stripe";
import { ProductStatus, ShopOrderStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildShippoShopAddress, getShippoUspsRateQuote } from "@/lib/shippo";
import { shopCartCheckoutSchema, shopCheckoutSchema } from "@/lib/validations";

class ShopCheckoutError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type CheckoutLineInput = {
  productId: string;
  variantId: string | null;
  colorOptionId: string | null;
  quantity: number;
};

type PreparedCheckoutLine = {
  productId: string;
  variantId: string | null;
  colorOptionId: string | null;
  productName: string;
  variantLabel: string;
  colorLabel: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  currency: string;
  checkoutPriceId: string;
};

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new ShopCheckoutError(
      "Stripe is not configured. Add STRIPE_SECRET_KEY before checking out shop products.",
      500,
    );
  }

  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
}

function getStripeMode() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (secretKey?.startsWith("sk_live_")) return "live" as const;
  if (secretKey?.startsWith("sk_test_")) return "test" as const;

  throw new ShopCheckoutError("Stripe key must start with sk_live_ or sk_test_.", 500);
}

function getRequestOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}

function getAbsoluteRequestUrl(request: Request, path: string) {
  return new URL(path, getRequestOrigin(request)).toString();
}

function parseCheckoutPayload(body: unknown) {
  const cartParsed = shopCartCheckoutSchema.safeParse(body);
  if (cartParsed.success) {
    return {
      items: cartParsed.data.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId ?? null,
        colorOptionId: item.colorOptionId ?? null,
        quantity: item.quantity,
      })),
      customerName: cartParsed.data.customerName,
      customerEmail: cartParsed.data.customerEmail,
      shippingName: cartParsed.data.shippingName,
      shippingAddress: cartParsed.data.shippingAddress,
      shippingCity: cartParsed.data.shippingCity,
      shippingState: cartParsed.data.shippingState.toUpperCase(),
      shippingZip: cartParsed.data.shippingZip,
      shippingPhone: cartParsed.data.shippingPhone,
    };
  }

  const singleParsed = shopCheckoutSchema.safeParse(body);
  if (singleParsed.success) {
    return {
      items: [
        {
          productId: singleParsed.data.productId,
          variantId: singleParsed.data.variantId ?? null,
          colorOptionId: singleParsed.data.colorOptionId ?? null,
          quantity: singleParsed.data.quantity,
        },
      ],
      customerName: singleParsed.data.customerName,
      customerEmail: singleParsed.data.customerEmail,
      shippingName: singleParsed.data.shippingName,
      shippingAddress: singleParsed.data.shippingAddress,
      shippingCity: singleParsed.data.shippingCity,
      shippingState: singleParsed.data.shippingState.toUpperCase(),
      shippingZip: singleParsed.data.shippingZip,
      shippingPhone: singleParsed.data.shippingPhone,
    };
  }

  const firstError =
    cartParsed.error?.errors[0]?.message ?? singleParsed.error?.errors[0]?.message ?? "Invalid checkout request.";
  throw new ShopCheckoutError(firstError, 400);
}

async function prepareCheckoutLines(items: CheckoutLineInput[]) {
  const stripeMode = getStripeMode();
  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
    },
    include: {
      colorOptions: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      variants: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  const productsById = new Map(products.map((product) => [product.id, product]));

  return items.map((item) => {
    const product = productsById.get(item.productId);

    if (!product) {
      throw new ShopCheckoutError("Product not found.", 404);
    }

    if (product.status !== ProductStatus.ACTIVE) {
      throw new ShopCheckoutError(`"${product.name}" is no longer available for checkout.`, 400);
    }

    const hasVariants = product.variants.length > 0;
    const variant = hasVariants ? product.variants.find((entry) => entry.id === item.variantId) : null;

    if (hasVariants && !variant) {
      throw new ShopCheckoutError(`Selected size for "${product.name}" was not found.`, 404);
    }

    const hasSelectableColorOptions = product.categoryId === "cat_paint" && product.colorOptions.length > 0;
    const colorOption = hasSelectableColorOptions
      ? product.colorOptions.find((entry) => entry.id === item.colorOptionId)
      : null;

    if (hasSelectableColorOptions && !colorOption) {
      throw new ShopCheckoutError(`Selected color for "${product.name}" was not found.`, 404);
    }

    const unitPriceCents = variant?.priceCents ?? product.priceCents;
    const currency = variant?.currency ?? product.currency;
    const checkoutPriceId = variant
      ? stripeMode === "live"
        ? variant.stripeLivePriceId ?? variant.stripePriceId
        : variant.stripeTestPriceId
      : stripeMode === "live"
        ? product.stripeLivePriceId ?? product.stripePriceId
        : product.stripeTestPriceId;

    if (!checkoutPriceId) {
      throw new ShopCheckoutError(
        `"${product.name}" is missing its Stripe ${stripeMode} price. Please contact support.`,
        409,
      );
    }

    return {
      productId: product.id,
      variantId: variant?.id ?? null,
      colorOptionId: colorOption?.id ?? null,
      productName: product.name,
      variantLabel: variant?.label ?? "Standard",
      colorLabel: colorOption?.label ?? null,
      imageUrl: product.imageUrls[0] ?? null,
      quantity: item.quantity,
      unitPriceCents,
      totalPriceCents: unitPriceCents * item.quantity,
      currency,
      checkoutPriceId,
    } satisfies PreparedCheckoutLine;
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      items,
      customerEmail,
      customerName,
      shippingName,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      shippingPhone,
    } = parseCheckoutPayload(body);

    const preparedLines = await prepareCheckoutLines(items);
    if (preparedLines.length === 0) {
      throw new ShopCheckoutError("Add at least one item to the cart before checkout.", 400);
    }

    const currencies = new Set(preparedLines.map((line) => line.currency));
    if (currencies.size > 1) {
      throw new ShopCheckoutError(
        "Your cart contains items with different currencies. Please check out those items separately.",
        400,
      );
    }

    const checkoutCurrency = preparedLines[0]?.currency ?? "usd";
    const subtotal = preparedLines.reduce((sum, line) => sum + line.totalPriceCents, 0);
    const totalQuantity = preparedLines.reduce((sum, line) => sum + line.quantity, 0);
    const shippoAddress = buildShippoShopAddress({
      shippingName,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      shippingPhone,
      customerEmail,
    });
    const shippingQuote = await getShippoUspsRateQuote({
      toAddress: shippoAddress,
      quantity: totalQuantity,
      metadata: `Shop checkout for ${customerEmail}`,
    });

    const order = await prisma.shopOrder.create({
      data: {
        customerName,
        customerEmail,
        shippingName,
        shippingAddress,
        shippingCity,
        shippingState,
        shippingZip,
        shippingPhone,
        shippingAmountCents: shippingQuote.amountCents,
        shippingProvider: shippingQuote.provider,
        shippingService: shippingQuote.service,
        shippingEstimatedDays: shippingQuote.estimatedDays,
        shippingArrivesBy: shippingQuote.arrivesBy,
        shippingEstimateLabel: shippingQuote.estimateLabel,
        shippoShipmentId: shippingQuote.shipmentId,
        shippoRateId: shippingQuote.rateId,
        currency: checkoutCurrency,
        status: ShopOrderStatus.PENDING,
        amountSubtotalCents: subtotal,
        amountTotalCents: subtotal + shippingQuote.amountCents,
        items: {
          create: preparedLines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            colorOptionId: line.colorOptionId,
            productNameSnapshot: line.productName,
            variantLabelSnapshot: line.variantLabel,
            colorLabelSnapshot: line.colorLabel,
            imageUrlSnapshot: line.imageUrl,
            quantity: line.quantity,
            unitPriceCents: line.unitPriceCents,
            totalPriceCents: line.totalPriceCents,
            currency: line.currency,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    try {
      const stripe = getStripeClient();
      const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        ...preparedLines.map((line) => ({
          price: line.checkoutPriceId,
          quantity: line.quantity,
        })),
        {
          price_data: {
            currency: checkoutCurrency,
            product_data: {
              name: `${shippingQuote.provider} Shipping`,
              description: shippingQuote.service,
              tax_code: "txcd_99999999",
            },
            unit_amount: shippingQuote.amountCents,
          },
          quantity: 1,
        },
      ];
      const stripeCustomer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        shipping: {
          name: shippingName,
          phone: shippingPhone,
          address: {
            line1: shippingAddress,
            city: shippingCity,
            state: shippingState,
            postal_code: shippingZip,
            country: "US",
          },
        },
      });
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        automatic_tax: { enabled: true },
        customer: stripeCustomer.id,
        client_reference_id: order.id,
        line_items: stripeLineItems,
        metadata: {
          checkoutType: "SHOP_CART",
          shopOrderId: order.id,
          itemCount: String(preparedLines.length),
        },
        success_url: getAbsoluteRequestUrl(
          request,
          `/shop/success?session_id={CHECKOUT_SESSION_ID}`,
        ),
        cancel_url: getAbsoluteRequestUrl(request, "/shop?canceled=true"),
      });

      await prisma.shopOrder.update({
        where: { id: order.id },
        data: {
          stripeCheckoutSessionId: checkoutSession.id,
        },
      });

      return NextResponse.json({ url: checkoutSession.url });
    } catch (stripeError) {
      await prisma.shopOrder.deleteMany({
        where: {
          id: order.id,
          stripeCheckoutSessionId: null,
          status: ShopOrderStatus.PENDING,
        },
      });
      throw stripeError;
    }
  } catch (error) {
    if (error instanceof ShopCheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof Stripe.errors.StripeError) {
      console.error("Shop checkout Stripe error:", {
        type: error.type,
        code: error.code,
        message: error.message,
      });
      return NextResponse.json(
        { error: error.message || "Stripe could not create the checkout session." },
        { status: error.statusCode ?? 500 },
      );
    }

    console.error("Shop checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create shop checkout session." },
      { status: 500 },
    );
  }
}
