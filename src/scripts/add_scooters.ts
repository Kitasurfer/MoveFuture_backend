import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows";

/**
 * Lightweight script to add a "Scooters" category and an "Electric Scooter X" product
 * without touching other seed data. Run with:
 *   medusa exec ./src/scripts/add_scooters.ts
 */
export default async function addScooters({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);

  // Retrieve default sales channel
  const [defaultSalesChannel] = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  // Retrieve default shipping profile
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });

  if (!shippingProfiles.length || !defaultSalesChannel) {
    throw new Error(
      "Default shipping profile or default sales channel not found. Run the main seed script first."
    );
  }

  const shippingProfile = shippingProfiles[0];

  // Create (or get) "Scooters" category
  let scooterCategoryId: string | undefined;
  try {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [
          {
            name: "Scooters",
            is_active: true,
          },
        ],
      },
    });
    scooterCategoryId = result[0].id;
  } catch (err: any) {
    // Likely already exists – fetch it
    logger.warn("Scooters category may already exist, attempting to fetch existing id.");
    const existing = await container
      .resolve("productCategoryService")
      .list({ name: "Scooters" }, { relations: [] });
    if (!existing?.length) throw err;
    scooterCategoryId = existing[0].id;
  }

  // Create product
  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Electric Scooter X",
          category_ids: [scooterCategoryId!],
          description: "A lightweight folding electric scooter for urban commuting.",
          handle: "electric-scooter-x",
          weight: 14000,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://images.unsplash.com/photo-1589464760065-779832d9b0a4?auto=format&fit=crop&w=800&q=80",
            },
            {
              url: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80",
            },
          ],
          options: [
            {
              title: "Color",
              values: ["Black", "White"],
            },
          ],
          variants: [
            {
              title: "Black",
              sku: "ESCOOT-BLK",
              options: {
                Color: "Black",
              },
              prices: [
                {
                  amount: 499,
                  currency_code: "eur",
                },
                {
                  amount: 549,
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "White",
              sku: "ESCOOT-WHT",
              options: {
                Color: "White",
              },
              prices: [
                {
                  amount: 499,
                  currency_code: "eur",
                },
                {
                  amount: 549,
                  currency_code: "usd",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel.id,
            },
          ],
        },
      ],
    },
  });

  logger.info("Successfully seeded Electric Scooter X product.");
}
