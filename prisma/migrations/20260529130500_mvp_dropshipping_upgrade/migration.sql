-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM (
    'STRIPE_CARD',
    'STRIPE_APPLE_PAY',
    'STRIPE_GOOGLE_PAY',
    'PAYPAL'
);

-- CreateEnum
CREATE TYPE "SupplierOrderStatus" AS ENUM (
    'DRAFT',
    'FORWARDED',
    'CONFIRMED',
    'SHIPPED',
    'DELIVERED',
    'REFUND_REQUESTED',
    'REFUNDED'
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "shippingWindow" TEXT NOT NULL DEFAULT 'Delivered in 5-10 days',
    "leadTimeMin" INTEGER NOT NULL DEFAULT 5,
    "leadTimeMax" INTEGER NOT NULL DEFAULT 10,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedPaymentMethod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "PaymentMethod" NOT NULL,
    "label" TEXT NOT NULL,
    "last4" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT,
    "author" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Product"
    ADD COLUMN "supplierSku" TEXT,
    ADD COLUMN "supplierCost" DECIMAL(10,2),
    ADD COLUMN "markupPercent" INTEGER NOT NULL DEFAULT 35,
    ADD COLUMN "averageRating" DECIMAL(3,2) NOT NULL DEFAULT 4.5,
    ADD COLUMN "reviewCount" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "unitsSold" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "shippingLeadMin" INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN "shippingLeadMax" INTEGER NOT NULL DEFAULT 10,
    ADD COLUMN "shippingLabel" TEXT NOT NULL DEFAULT 'Delivered in 5-10 days',
    ADD COLUMN "fastShippingEligible" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "isTrending" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "variantSummary" TEXT,
    ADD COLUMN "supplierId" TEXT;

-- AlterTable
ALTER TABLE "Order"
    ADD COLUMN "supplierOrderStatus" "SupplierOrderStatus" NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'STRIPE_CARD',
    ADD COLUMN "customerName" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "email" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "phone" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "trackingNumber" TEXT,
    ADD COLUMN "trackingUrl" TEXT,
    ADD COLUMN "supplierSummary" TEXT,
    ADD COLUMN "supplierReference" TEXT,
    ADD COLUMN "fulfillmentNotes" TEXT,
    ADD COLUMN "estimatedDelivery" TEXT;

-- AlterTable
ALTER TABLE "OrderItem"
    ADD COLUMN "supplierName" TEXT,
    ADD COLUMN "supplierSku" TEXT,
    ADD COLUMN "variantSnapshot" TEXT,
    ADD COLUMN "shippingLabel" TEXT;

-- AlterTable
ALTER TABLE "Address"
    ADD COLUMN "label" TEXT,
    ADD COLUMN "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_slug_key" ON "Supplier"("slug");

-- CreateIndex
CREATE INDEX "Product_supplierId_idx" ON "Product"("supplierId");

-- CreateIndex
CREATE INDEX "Order_supplierOrderStatus_idx" ON "Order"("supplierOrderStatus");

-- CreateIndex
CREATE INDEX "SavedPaymentMethod_userId_idx" ON "SavedPaymentMethod"("userId");

-- CreateIndex
CREATE INDEX "Review_productId_idx" ON "Review"("productId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- AddForeignKey
ALTER TABLE "Product"
    ADD CONSTRAINT "Product_supplierId_fkey"
    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPaymentMethod"
    ADD CONSTRAINT "SavedPaymentMethod_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review"
    ADD CONSTRAINT "Review_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review"
    ADD CONSTRAINT "Review_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
