import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils";

/*
 * Simple debugging script to inspect Electric Scooter X product, its variants,
 * inventory levels and publishable API keys.
 */
export default async function debugScooter({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  // Fetch publishable API keys
  const { data: apiKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "title", "token", "type"],
  });
  console.log("API Keys:", apiKeys);

  // Fetch scooter product by handle
  const { data: products } = await query.graph({
    entity: "product",
    filters: {
      handle: "electric-scooter-x",
    },
    fields: [
      "id",
      "title",
      "status",
      "handle",
      "is_giftcard",
      "deleted_at",
      "collection_id",
    ],
  });
  if (!products.length) {
    logger.warn("Scooter product not found");
    return;
  }
  const scooter = products[0];
  console.log("Scooter product:", scooter);

  // Fetch variants for scooter
  const { data: variants } = await query.graph({
    entity: "product_variant",
    filters: {
      product_id: scooter.id,
    },
    fields: [
      "id",
      "title",
      "inventory_quantity",
      "allow_backorder",
      "manage_inventory",
    ],
  });
  console.log("Variants:", variants);

  // Fetch inventory levels for scooter variants
  const { data: inventoryLevels } = await query.graph({
    entity: "inventory_level",
    fields: ["location_id", "stocked_quantity", "inventory_item_id"],
  });
  console.log("Inventory levels (first 10):", inventoryLevels.slice(0, 10));
}
