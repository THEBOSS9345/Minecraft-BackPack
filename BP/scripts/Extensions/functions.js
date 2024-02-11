import { ItemStack, Player, world } from "@minecraft/server";
import config from "../config";
/**
 * 
 * @param {Player} player  - Player to get items from
 * @returns {Promise<[{item: import('./function').ItemInfoObject, slot: number}]>}
 */
export function getItems(player) {
    return new Promise((res) => {
        const inv = player.getComponent('inventory').container;
        const items = [];
        for (let i = 0; i < inv.size; i++) {
            const item = inv.getItem(i);
            if (item && config.BannedItemIds.every((i) => i !== item.typeId)) items.push({ item: itemInfo(item), slot: i });
        }
        res(items);
    });
};

/**
 * 
 * @param {String} str 
 * @returns 
 */
export const formatString = (str) => str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');



/**
 * 
 * @param {ItemStack} item - ItemStack to get info from
 * @returns {import('./function').ItemInfoObject}
*/
export function itemInfo(item) {
    if (!item) return undefined
    const itemEnc = item.getComponent('enchantable')
    const itemInfo = {
        id: item.typeId,
        amount: item.amount,
        lore: item.getLore(),
        nameTag: item.nameTag,
        enchantments: [],
        durability: item.getComponent("durability")?.maxDurability ? item.getComponent("durability")?.maxDurability - (item.getComponent("durability")?.maxDurability - item.getComponent("durability")?.damage) : undefined,
        DynamicPropertys: Database.entries(item)
    };
    if (itemEnc && itemEnc.isValid()) {
        for (const enchant of itemEnc.getEnchantments()) itemInfo.enchantments.push({ type: enchant.type.id, level: enchant.level })
    }
    return itemInfo;
}

/**
 * 
 * @param {import('./function').ItemInfoObject} info 
 * @returns 
 */
export function getItemDetails(info) {
    const details = [
        info.item.enchantments?.length > 0 && `§9Equipment§r\n${info.item.enchantments.map(({ type, level }) => `§7${formatString(type)} ${toRoman(level)}`).join('\n')}`,
        info.item.lore && info.item.lore.join('\n')
    ].filter(Boolean)
    return details
}

/**
 * 
 * @param {Number} number 
 * @returns {String}
 */
function toRoman(number) {
    let num = number.valueOf();
    const lookup = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let roman = '';
    for (let i in lookup) {
        while (num >= lookup[i]) {
            roman += i;
            num -= lookup[i];
        }
    }
    return roman;
}
/**
 * 
 * @param {Player} player 
 * @param {import('./function').ItemInfoObject} item 
 * @returns 
 */
export function giveItem(player, item) {
    return new Promise((res) => {
        const inv = player.getComponent('inventory').container;
        if (inv.emptySlotsCount < 1) return player.sendMessage('§cYou do not have enough space in your inventory to take this item')
        const itemStack = new ItemStack(item.id, item.amount)
        if (item.enchantments && item.enchantments.length > 0) {
            const enchantComp = itemStack.getComponent("enchantable")
            for (const enchant of item.enchantments) enchantComp.addEnchantment(enchant);
        }
        if (item?.durability) itemStack.getComponent('durability').damage = item.durability
        if (item?.nameTag) itemStack.nameTag = item.nameTag
        if (item?.lore) itemStack.setLore(item.lore)
        if (item?.DynamicPropertys) item.DynamicPropertys.forEach((data) => Database.set(data[0], data[1], itemStack))
        inv.addItem(itemStack)
        res(itemStack)
    })
}

/**
 * 
 * @param {Player} player 
 * @param {string} ScoreBoardName 
 * @returns 
 */
export function GetScore(player, ScoreBoardName) {
    try {
        return world.scoreboard.getObjective(ScoreBoardName).getScore(player)
    } catch { return 0 }
}

/**
 * 
 * @param {Player} player 
 * @param {string} ScoreBoardName 
 * @param {number} value 
 */
export function SetScore(player, ScoreBoardName, value) {
    try {
        world.scoreboard.getObjective(ScoreBoardName).setScore(player, value)
    } catch {
        player.dimension.runCommandAsync(`scoreboard players set "${player.name}" ${ScoreBoardName} ${value}`)
    }
}