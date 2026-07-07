import {
  buildCuratedDummyJsonSelection,
  cleanDummyJsonTitle,
  deriveDummyJsonCompareAtPrice,
  deriveDummyJsonMarkupPercent,
  deriveDummyJsonSupplierCost,
  getDummyJsonSourceImages,
  mapDummyJsonCategory,
  parseDummyJsonShippingWindow,
  type DummyJsonProduct,
} from "@/lib/dummyjson";

function createProduct(overrides: Partial<DummyJsonProduct>): DummyJsonProduct {
  return {
    id: 1,
    title: "Sample Product",
    description: "Sample product description for testing.",
    category: "smartphones",
    price: 100,
    discountPercentage: 10,
    rating: 4.5,
    stock: 24,
    brand: "Vinaroda",
    sku: "TEST-001",
    shippingInformation: "Ships in 3-5 business days",
    reviews: [
      {
        rating: 5,
        comment: "Loved it",
        reviewerName: "Casey",
      },
    ],
    images: [
      "https://example.com/1.webp",
      "https://example.com/2.webp",
      "https://example.com/3.webp",
    ],
    thumbnail: "https://example.com/thumb.webp",
    ...overrides,
  };
}

describe("dummyjson helpers", () => {
  it("maps allowed source categories into Vinaroda categories", () => {
    expect(mapDummyJsonCategory("womens-shoes")).toBe("women");
    expect(mapDummyJsonCategory("mens-watches")).toBe("men");
    expect(mapDummyJsonCategory("furniture")).toBe("home");
    expect(mapDummyJsonCategory("skin-care")).toBe("beauty");
    expect(mapDummyJsonCategory("tablets")).toBe("electronics");
    expect(mapDummyJsonCategory("groceries")).toBeNull();
  });

  it("parses shipping information into delivery windows", () => {
    expect(parseDummyJsonShippingWindow("Ships overnight")).toEqual({
      min: 1,
      max: 1,
      label: "Delivered in 1 day",
    });
    expect(parseDummyJsonShippingWindow("Ships in 3-5 business days")).toEqual({
      min: 3,
      max: 5,
      label: "Delivered in 3-5 days",
    });
    expect(parseDummyJsonShippingWindow("Ships in 2 weeks")).toEqual({
      min: 10,
      max: 14,
      label: "Delivered in 10-14 days",
    });
  });

  it("cleans awkward titles lightly", () => {
    expect(cleanDummyJsonTitle("  Chanel Coco Noir Eau De   ")).toBe(
      "Chanel Coco Noir",
    );
  });

  it("derives price fields for imported products", () => {
    const supplierCost = deriveDummyJsonSupplierCost(100);
    expect(supplierCost).toBe(65);
    expect(deriveDummyJsonMarkupPercent(100, supplierCost)).toBe(54);
    expect(deriveDummyJsonCompareAtPrice(100, 20)).toBe(125);
  });

  it("dedupes image candidates and trims them to five", () => {
    const images = getDummyJsonSourceImages(
      createProduct({
        images: [
          "https://example.com/1.webp",
          "https://example.com/2.webp",
          "https://example.com/2.webp",
          "https://example.com/3.webp",
          "https://example.com/4.webp",
          "https://example.com/5.webp",
        ],
        thumbnail: "https://example.com/5.webp",
      }),
    );

    expect(images).toEqual([
      "https://example.com/1.webp",
      "https://example.com/2.webp",
      "https://example.com/3.webp",
      "https://example.com/4.webp",
      "https://example.com/5.webp",
    ]);
  });

  it("filters weak products and builds curated metadata", () => {
    const selected = buildCuratedDummyJsonSelection([
      createProduct({
        id: 1,
        title: "Premium Tablet",
        category: "tablets",
        sku: "TAB-001",
      }),
      createProduct({
        id: 2,
        title: "Slow Product",
        category: "tablets",
        sku: "TAB-002",
        shippingInformation: "Ships in 1 month",
      }),
      createProduct({
        id: 3,
        title: "Low Rated Product",
        category: "mens-shirts",
        sku: "MEN-001",
        rating: 3.2,
      }),
      createProduct({
        id: 4,
        title: "Stylish Bag",
        category: "womens-bags",
        sku: "WMN-001",
        discountPercentage: 18,
      }),
    ]);

    expect(selected).toHaveLength(2);
    expect(selected[0]?.sourceImages).toHaveLength(4);
    expect(selected.map((item) => item.storefrontCategorySlug)).toEqual(
      expect.arrayContaining(["electronics", "women"]),
    );
    expect(selected[0]?.compareAtPrice).toBeGreaterThan(selected[0]?.price ?? 0);
  });
});
