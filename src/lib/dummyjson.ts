import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PrismaClient, Review } from "@prisma/client";
import { getShippingLabel, roundMoney } from "@/lib/commerce";
import { slugify } from "@/lib/utils";

export type StorefrontCategorySlug =
  | "women"
  | "men"
  | "home"
  | "beauty"
  | "electronics";

type StorefrontCategoryDefinition = {
  name: string;
  sourceCategories: readonly string[];
  quota: number;
};

export const STOREFRONT_CATEGORY_DEFINITIONS: Record<
  StorefrontCategorySlug,
  StorefrontCategoryDefinition
> = {
  women: {
    name: "Women",
    sourceCategories: [
      "tops",
      "womens-bags",
      "womens-dresses",
      "womens-jewellery",
      "womens-shoes",
      "womens-watches",
    ],
    quota: 10,
  },
  men: {
    name: "Men",
    sourceCategories: ["mens-shirts", "mens-shoes", "mens-watches"],
    quota: 8,
  },
  home: {
    name: "Home",
    sourceCategories: ["furniture", "home-decoration"],
    quota: 6,
  },
  beauty: {
    name: "Beauty",
    sourceCategories: ["fragrances", "skin-care"],
    quota: 8,
  },
  electronics: {
    name: "Electronics",
    sourceCategories: ["smartphones", "laptops", "tablets"],
    quota: 8,
  },
};

export const DUMMYJSON_IMPORT_TARGET = 40;
export const DUMMYJSON_IMPORT_MINIMUM = 30;
export const DUMMYJSON_IMPORT_SUPPLIER_SLUG = "dummyjson-curated-feed";
export const DUMMYJSON_IMPORT_SUPPLIER_NAME = "DummyJSON Curated Feed";

export type DummyJsonReview = {
  rating: number;
  comment: string;
  reviewerName: string;
  reviewerEmail?: string;
};

export type DummyJsonProduct = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage?: number;
  rating: number;
  stock: number;
  brand?: string;
  sku?: string;
  shippingInformation?: string;
  availabilityStatus?: string;
  reviews?: DummyJsonReview[];
  images: string[];
  thumbnail?: string;
};

export type CuratedDummyJsonCandidate = {
  source: DummyJsonProduct;
  storefrontCategorySlug: StorefrontCategorySlug;
  shippingLeadMin: number;
  shippingLeadMax: number;
  shippingLabel: string;
  sourceImages: string[];
  score: number;
};

export type CuratedDummyJsonProduct = CuratedDummyJsonCandidate & {
  categoryName: string;
  sku: string;
  supplierSku: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  supplierCost: number;
  markupPercent: number;
  compareAtPrice?: number;
  reviewCount: number;
  unitsSold: number;
  fastShippingEligible: boolean;
  isBestSeller: boolean;
  isTrending: boolean;
  variantSummary?: string;
};

export type CuratedDummyJsonImportResult = {
  created: number;
  updated: number;
  skipped: number;
  selected: number;
};

const SOURCE_CATEGORY_TO_STOREFRONT = Object.entries(
  STOREFRONT_CATEGORY_DEFINITIONS,
).reduce<Record<string, StorefrontCategorySlug>>((accumulator, entry) => {
  const [storefrontSlug, definition] = entry as [
    StorefrontCategorySlug,
    StorefrontCategoryDefinition,
  ];

  for (const sourceCategory of definition.sourceCategories) {
    accumulator[sourceCategory] = storefrontSlug;
  }

  return accumulator;
}, {});

function parseSingleShippingValue(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseDummyJsonShippingWindow(shippingInformation?: string) {
  const normalized = shippingInformation?.trim().toLowerCase() ?? "";
  if (!normalized) {
    return null;
  }

  if (normalized.includes("overnight")) {
    return {
      min: 1,
      max: 1,
      label: getShippingLabel(1, 1),
    };
  }

  const dayRangeMatch = normalized.match(/(\d+)\s*-\s*(\d+)\s*business day/);
  if (dayRangeMatch) {
    const min = parseSingleShippingValue(dayRangeMatch[1]);
    const max = parseSingleShippingValue(dayRangeMatch[2]);
    if (min && max) {
      return {
        min,
        max,
        label: getShippingLabel(min, max),
      };
    }
  }

  const dayMatch = normalized.match(/(\d+)\s*business day/);
  if (dayMatch) {
    const day = parseSingleShippingValue(dayMatch[1]);
    if (day) {
      return {
        min: day,
        max: day,
        label: getShippingLabel(day, day),
      };
    }
  }

  const weekMatch = normalized.match(/(\d+)\s*week/);
  if (weekMatch) {
    const weeks = parseSingleShippingValue(weekMatch[1]);
    if (weeks) {
      const max = weeks * 7;
      const min = Math.max(1, max - 4);
      return {
        min,
        max,
        label: getShippingLabel(min, max),
      };
    }
  }

  const monthMatch = normalized.match(/(\d+)\s*month/);
  if (monthMatch) {
    const months = parseSingleShippingValue(monthMatch[1]);
    if (months) {
      const max = months * 30;
      const min = Math.max(7, max - 10);
      return {
        min,
        max,
        label: getShippingLabel(min, max),
      };
    }
  }

  return null;
}

export function mapDummyJsonCategory(category: string) {
  return SOURCE_CATEGORY_TO_STOREFRONT[category] ?? null;
}

export function getDummyJsonSourceImages(product: DummyJsonProduct) {
  return Array.from(
    new Set(
      [...product.images, product.thumbnail]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).slice(0, 5);
}

export function cleanDummyJsonTitle(title: string) {
  return title
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\bEau De$/i, "")
    .replace(/\bEau de$/i, "")
    .trim();
}

export function deriveDummyJsonSupplierCost(price: number) {
  return roundMoney(price * 0.65);
}

export function deriveDummyJsonMarkupPercent(price: number, supplierCost: number) {
  if (supplierCost <= 0) {
    return 35;
  }

  return Math.max(0, Math.round(((price - supplierCost) / supplierCost) * 100));
}

export function deriveDummyJsonCompareAtPrice(
  price: number,
  discountPercentage?: number,
) {
  if (
    discountPercentage === undefined ||
    discountPercentage <= 0 ||
    discountPercentage >= 90
  ) {
    return undefined;
  }

  const compareAtPrice = roundMoney(price / (1 - discountPercentage / 100));
  return compareAtPrice > price ? compareAtPrice : undefined;
}

function getDummyJsonEligibilityScore(product: DummyJsonProduct) {
  return (
    product.rating * 100 +
    Math.min(product.stock, 100) +
    (product.discountPercentage ?? 0) * 4
  );
}

export function buildCuratedDummyJsonSelection(products: DummyJsonProduct[]) {
  const candidates = products
    .map((product) => {
      const storefrontCategorySlug = mapDummyJsonCategory(product.category);
      if (!storefrontCategorySlug) {
        return null;
      }

      const shipping = parseDummyJsonShippingWindow(product.shippingInformation);
      if (!shipping || shipping.max > 14) {
        return null;
      }

      const sourceImages = getDummyJsonSourceImages(product);
      if (product.stock <= 0 || sourceImages.length < 3 || product.rating < 3.8) {
        return null;
      }

      return {
        source: product,
        storefrontCategorySlug,
        shippingLeadMin: shipping.min,
        shippingLeadMax: shipping.max,
        shippingLabel: shipping.label,
        sourceImages,
        score: getDummyJsonEligibilityScore(product),
      } satisfies CuratedDummyJsonCandidate;
    })
    .filter((candidate): candidate is CuratedDummyJsonCandidate => candidate !== null);

  const selected: CuratedDummyJsonCandidate[] = [];
  const selectedIds = new Set<number>();

  for (const [storefrontCategorySlug, definition] of Object.entries(
    STOREFRONT_CATEGORY_DEFINITIONS,
  ) as [StorefrontCategorySlug, StorefrontCategoryDefinition][]) {
    const categoryCandidates = candidates
      .filter((candidate) => candidate.storefrontCategorySlug === storefrontCategorySlug)
      .sort((left, right) => right.score - left.score);

    for (const candidate of categoryCandidates.slice(0, definition.quota)) {
      selected.push(candidate);
      selectedIds.add(candidate.source.id);
    }
  }

  const leftovers = candidates
    .filter((candidate) => !selectedIds.has(candidate.source.id))
    .sort((left, right) => right.score - left.score);

  for (const candidate of leftovers) {
    if (selected.length >= DUMMYJSON_IMPORT_TARGET) {
      break;
    }

    selected.push(candidate);
    selectedIds.add(candidate.source.id);
  }

  const bestsellerIds = new Set(
    [...selected]
      .sort((left, right) => right.score - left.score)
      .slice(0, Math.min(12, selected.length))
      .map((candidate) => candidate.source.id),
  );
  const trendingIds = new Set(
    [...selected]
      .sort((left, right) => {
        const leftTrendScore =
          (left.source.discountPercentage ?? 0) * 8 + left.source.rating * 100;
        const rightTrendScore =
          (right.source.discountPercentage ?? 0) * 8 + right.source.rating * 100;
        return rightTrendScore - leftTrendScore;
      })
      .slice(0, Math.min(16, selected.length))
      .map((candidate) => candidate.source.id),
  );

  return selected.map((candidate) => {
    const title = cleanDummyJsonTitle(candidate.source.title);
    const price = roundMoney(candidate.source.price);
    const supplierCost = deriveDummyJsonSupplierCost(price);
    const reviewCount = Math.max(candidate.source.reviews?.length ?? 0, 0);

    return {
      ...candidate,
      categoryName:
        STOREFRONT_CATEGORY_DEFINITIONS[candidate.storefrontCategorySlug].name,
      sku:
        candidate.source.sku?.trim().toUpperCase() ||
        `DUMMYJSON-${candidate.source.category}-${candidate.source.id}`.toUpperCase(),
      supplierSku:
        candidate.source.sku?.trim().toUpperCase() ||
        `DJ-SRC-${candidate.source.id}`.toUpperCase(),
      slug: `${slugify(title)}-dummyjson-${candidate.source.id}`,
      title,
      description: candidate.source.description.trim(),
      price,
      supplierCost,
      markupPercent: deriveDummyJsonMarkupPercent(price, supplierCost),
      compareAtPrice: deriveDummyJsonCompareAtPrice(
        price,
        candidate.source.discountPercentage,
      ),
      reviewCount,
      unitsSold: Math.round(candidate.score * 1.5),
      fastShippingEligible: candidate.shippingLeadMax <= 5,
      isBestSeller: bestsellerIds.has(candidate.source.id),
      isTrending: trendingIds.has(candidate.source.id),
      variantSummary: candidate.source.brand?.trim() || undefined,
    } satisfies CuratedDummyJsonProduct;
  });
}

async function fetchDummyJsonProducts(fetchImpl: typeof fetch) {
  const response = await fetchImpl("https://dummyjson.com/products?limit=200", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`DummyJSON request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { products?: DummyJsonProduct[] };
  if (!Array.isArray(payload.products)) {
    throw new Error("DummyJSON payload did not include products.");
  }

  return payload.products;
}

function inferImageExtension(url: string, contentType: string | null) {
  if (contentType?.includes("webp")) {
    return ".webp";
  }
  if (contentType?.includes("png")) {
    return ".png";
  }
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) {
    return ".jpg";
  }

  const urlPath = new URL(url).pathname;
  const extension = path.extname(urlPath);
  return extension || ".jpg";
}

async function downloadDummyJsonImageSet(
  product: CuratedDummyJsonProduct,
  fetchImpl: typeof fetch,
) {
  const folderName = product.slug;
  const relativeDirectory = path.posix.join(
    "uploads",
    "imports",
    "dummyjson",
    folderName,
  );
  const absoluteDirectory = path.join(process.cwd(), "public", relativeDirectory);

  await rm(absoluteDirectory, { recursive: true, force: true });
  await mkdir(absoluteDirectory, { recursive: true });

  const imagePaths: string[] = [];

  for (const [index, url] of product.sourceImages.entries()) {
    try {
      const response = await fetchImpl(url, { cache: "no-store" });
      if (!response.ok) {
        continue;
      }

      const extension = inferImageExtension(url, response.headers.get("content-type"));
      const filename = `${String(index + 1).padStart(2, "0")}${extension}`;
      const absolutePath = path.join(absoluteDirectory, filename);
      const buffer = Buffer.from(await response.arrayBuffer());
      await writeFile(absolutePath, buffer);
      imagePaths.push(`/${path.posix.join(relativeDirectory, filename)}`);
    } catch {
      continue;
    }
  }

  if (imagePaths.length < 3) {
    await rm(absoluteDirectory, { recursive: true, force: true });
    return null;
  }

  return imagePaths.slice(0, 5);
}

function buildImportedReviewTitle(review: DummyJsonReview) {
  const compactComment = review.comment.replace(/\s+/g, " ").trim();
  if (compactComment.length <= 48) {
    return compactComment;
  }

  return `${compactComment.slice(0, 45).trimEnd()}...`;
}

async function syncImportedReviews(params: {
  prisma: PrismaClient;
  productId: string;
  incomingReviews: DummyJsonReview[];
  existingReviews: Review[];
}) {
  const reviews = params.incomingReviews
    .map((review) => ({
      author: review.reviewerName.trim() || "Verified customer",
      rating: Math.min(Math.max(Math.round(review.rating), 1), 5),
      title: buildImportedReviewTitle(review),
      body: review.comment.trim(),
    }))
    .filter((review) => review.body.length >= 3)
    .slice(0, 3);

  for (const review of reviews) {
    const exists = params.existingReviews.some(
      (existingReview) =>
        existingReview.userId === null &&
        existingReview.author === review.author &&
        existingReview.body === review.body,
    );

    if (!exists) {
      await params.prisma.review.create({
        data: {
          productId: params.productId,
          author: review.author,
          rating: review.rating,
          title: review.title,
          body: review.body,
        },
      });
    }
  }
}

export async function importCuratedDummyJsonCatalog(params: {
  prisma: PrismaClient;
  fetchImpl?: typeof fetch;
}) {
  const fetchImpl = params.fetchImpl ?? fetch;
  const products = await fetchDummyJsonProducts(fetchImpl);
  const curatedProducts = buildCuratedDummyJsonSelection(products);

  if (curatedProducts.length < DUMMYJSON_IMPORT_MINIMUM) {
    throw new Error(
      `Expected at least ${DUMMYJSON_IMPORT_MINIMUM} curated products but only found ${curatedProducts.length}.`,
    );
  }

  const supplier = await params.prisma.supplier.upsert({
    where: { slug: DUMMYJSON_IMPORT_SUPPLIER_SLUG },
    update: {
      name: DUMMYJSON_IMPORT_SUPPLIER_NAME,
      contactEmail: "catalog@dummyjson.local",
      contactPhone: "000-000-0000",
      leadTimeMin: 3,
      leadTimeMax: 10,
      shippingWindow: getShippingLabel(3, 10),
      notes: "Curated importer for DummyJSON catalog filler products.",
      isActive: true,
    },
    create: {
      name: DUMMYJSON_IMPORT_SUPPLIER_NAME,
      slug: DUMMYJSON_IMPORT_SUPPLIER_SLUG,
      contactEmail: "catalog@dummyjson.local",
      contactPhone: "000-000-0000",
      leadTimeMin: 3,
      leadTimeMax: 10,
      shippingWindow: getShippingLabel(3, 10),
      notes: "Curated importer for DummyJSON catalog filler products.",
      isActive: true,
    },
  });

  const categoryRecords = await Promise.all(
    (Object.entries(STOREFRONT_CATEGORY_DEFINITIONS) as [
      StorefrontCategorySlug,
      StorefrontCategoryDefinition,
    ][]).map(([slug, definition]) =>
      params.prisma.category.upsert({
        where: { slug },
        update: { name: definition.name },
        create: { slug, name: definition.name },
      }),
    ),
  );

  const categoryBySlug = new Map(categoryRecords.map((category) => [category.slug, category]));
  const result: CuratedDummyJsonImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    selected: curatedProducts.length,
  };

  for (const product of curatedProducts) {
    const category = categoryBySlug.get(product.storefrontCategorySlug);
    if (!category) {
      result.skipped += 1;
      continue;
    }

    const localImages = await downloadDummyJsonImageSet(product, fetchImpl);
    if (!localImages || localImages.length < 3) {
      result.skipped += 1;
      continue;
    }

    const existingProduct = await params.prisma.product.findUnique({
      where: { sku: product.sku },
      include: { reviews: true },
    });

    if (existingProduct && existingProduct.supplierId !== supplier.id) {
      result.skipped += 1;
      continue;
    }

    const payload = {
      title: product.title,
      slug: product.slug,
      description: product.description,
      sku: product.sku,
      supplierSku: product.supplierSku,
      price: product.price,
      supplierCost: product.supplierCost,
      markupPercent: product.markupPercent,
      compareAtPrice: product.compareAtPrice,
      stock: product.source.stock,
      isActive: true,
      averageRating: roundMoney(product.source.rating),
      reviewCount: product.reviewCount,
      unitsSold: product.unitsSold,
      shippingLeadMin: product.shippingLeadMin,
      shippingLeadMax: product.shippingLeadMax,
      shippingLabel: product.shippingLabel,
      fastShippingEligible: product.fastShippingEligible,
      isBestSeller: product.isBestSeller,
      isTrending: product.isTrending,
      variantSummary: product.variantSummary,
      categoryId: category.id,
      supplierId: supplier.id,
    };

    if (existingProduct) {
      await params.prisma.product.update({
        where: { id: existingProduct.id },
        data: payload,
      });
      await params.prisma.productImage.deleteMany({
        where: { productId: existingProduct.id },
      });
      await params.prisma.productImage.createMany({
        data: localImages.map((imagePath, index) => ({
          productId: existingProduct.id,
          path: imagePath,
          alt: product.title,
          sortOrder: index,
        })),
      });
      await syncImportedReviews({
        prisma: params.prisma,
        productId: existingProduct.id,
        incomingReviews: product.source.reviews ?? [],
        existingReviews: existingProduct.reviews,
      });
      result.updated += 1;
      continue;
    }

    const createdProduct = await params.prisma.product.create({
      data: {
        ...payload,
        images: {
          create: localImages.map((imagePath, index) => ({
            path: imagePath,
            alt: product.title,
            sortOrder: index,
          })),
        },
      },
      include: { reviews: true },
    });
    await syncImportedReviews({
      prisma: params.prisma,
      productId: createdProduct.id,
      incomingReviews: product.source.reviews ?? [],
      existingReviews: createdProduct.reviews,
    });
    result.created += 1;
  }

  return result;
}
