import { Enchantment, world } from "@minecraft/server";

export interface ItemInfoObject {
    id: string;
    nameTag: string;
    amount: number;
    lore: string[];
    enchantments: Enchantment[];
    durability: number | undefined,
    DynamicPropertys: []
}