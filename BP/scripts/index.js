import { ItemStack, Player, world } from '@minecraft/server'
import ChestForm from './Extensions/ChestForm/form'
import { getItems, formatString, getItemDetails, giveItem, GetScore, SetScore } from './Extensions/functions.js'
import Database from './Extensions/Database.js'
import config from './config'
import { ModalFormData } from '@minecraft/server-ui'

world.afterEvents.itemUse.subscribe(({ itemStack, source }) => {
    if (itemStack.typeId === config.BackPackItemId && source instanceof Player) return BackPack(source, itemStack)
})

/**
 * 
 * @param {Player} player 
 * @param {Number} Pages 
 * @param {ItemStack} itemStack 
 */
async function BackPack(player, itemStack, Pages = 1) {
    /**@type {{item: import('./Extensions/function.js').ItemInfoObject, page: number, slot: number}[]} */
    const items = Database.entries(itemStack).filter((data) => data[0].includes('BackPack:') && data[1]).filter((data) => data[1].page === Pages).map((data) => data[1]);
    const maxPages = Object.entries(config.Pages.customPages).find((data) => Database.has(`BackPackLevel:${data[0]}`, itemStack))?.[1].page ?? config.Pages.default
    const playerInv = player.getComponent('inventory').container;
    const form = new ChestForm()
        .title(`§6BackPack §ePage §6${Pages}`)
        .pattern([0, 0], [
            'ussbTnsss',
            'aaaaaaaaa',
            'aaaaaaaaa',
            'aaaaaaaaa',
            'aaaaaaaaa',
            'aaaaaaaaa',
        ], {
            a: {
                iconPath: 'minecraft:barrier', itemName: '§cEmpty Slot', itemDesc: ['§7This slot is empty'], stackAmount: 1, enchanted: false, callback: (slot) => {
                    if (playerInv.getItem(player.selectedSlot).typeId !== config.BackPackItemId) return player.sendMessage('§cYou can\'t move items from your inventory to your backpack')
                    return addItemsBackPack(player, itemStack, slot, Pages)
                }
            },
            b: {
                iconPath: Pages > 1 ? 'textures/ui/arrow_dark_left_stretch.png' : 'textures/blocks/tinted_glass', itemName: Pages > 1 ? '§6Previous Page' : '', itemDesc: [Pages > 1 ? '§7Click to go to the previous page' : ''], stackAmount: 1, enchanted: false, callback: () => {
                    if (playerInv.getItem(player.selectedSlot).typeId !== config.BackPackItemId) return player.sendMessage('§cYou can\'t move items from your inventory to your backpack')
                    if (Pages > 1) return BackPack(player, itemStack, Pages - 1)
                }
            },
            n: {
                iconPath: maxPages > Pages ? 'textures/ui/arrow_dark_right_stretch.png' : 'textures/blocks/tinted_glass', itemName: maxPages > Pages ? '§6Next Page' : '', itemDesc: [maxPages > Pages ? '§7Click to go to the next page' : ''], stackAmount: 1, enchanted: false, callback: () => {
                    if (playerInv.getItem(player.selectedSlot).typeId !== config.BackPackItemId) return player.sendMessage('§cYou can\'t move items from your inventory to your backpack')
                    if (maxPages > Pages) return BackPack(player, itemStack, Pages + 1)
                }
            },
            s: { iconPath: 'textures/blocks/tinted_glass', itemName: '', itemDesc: [], stackAmount: 1, enchanted: false },
            T: { iconPath: 'textures/items/backpack', itemName: `${player.name} §6BackPack`, itemDesc: [`§7BackPack Pages: §6${maxPages == 0 ? 1 : maxPages}`, `§7BackPack Items: §6${items.length}§7`, '§7Right Click Here To Upgrade Your BackPack '], stackAmount: 1, enchanted: false },
            u: {
                iconPath: 'anvil', itemName: '§6Upgrade BackPack', itemDesc: ['§7Click to upgrade your backpack'], stackAmount: 1, enchanted: false, callback: () => {
                    if (playerInv.getItem(player.selectedSlot).typeId !== config.BackPackItemId) return player.sendMessage('§cYou can\'t move items from your inventory to your backpack')
                    const currentPageLevel = Object.entries(config.Pages.customPages).find((data) => Database.has(`BackPackLevel:${data[0]}`, itemStack))?.[1].page ?? config.Pages.default;
                    const upgrades = Object.entries(config.Pages.customPages).filter((data) => currentPageLevel !== undefined && data[1].page > currentPageLevel).sort((a, b) => a[1].page - b[1].page)
                    if (upgrades.length === 0) return player.sendMessage('§cYou have the max level of backpack');
                    new ModalFormData()
                        .title('§6Upgrade BackPack')
                        .dropdown('§6Select a upgrade', upgrades.map((data) => `§6Upgrade: §e${data[0]} §6Price: §e${data[1].price}`), 0)
                        .toggle('§6Confirm Upgrade', false)
                        .show(player).then((data) => {
                        if (data.canceled) return;
                        const [updateIndex, Confirm] = data.formValues;
                            if (!Confirm) return player.sendMessage('§cYou need to confirm the upgrade');
                            const [UpgradeName, Info] = upgrades[updateIndex];
                            if (GetScore(player, config.ScoreBoardName) < Info.price) return player.sendMessage(`§cYou Need §6${Info.price - GetScore(player, config.ScoreBoardName)} §cMore Upgrade Your BackPack`);
                            SetScore(player, config.ScoreBoardName, (GetScore(player, config.ScoreBoardName) - Info.price));
                            Database.entries(itemStack).filter((data) => data[0].includes('BackPackLevel:')).forEach((data) => Database.delete(data[0], itemStack))
                            playerInv.setItem(player.selectedSlot, itemStack);
                            Database.set(`BackPackLevel:${UpgradeName}`, Info, itemStack);
                            playerInv.setItem(player.selectedSlot, itemStack);
                            player.sendMessage(`§aYou have successfully upgraded your backpack to §6${UpgradeName}`);
                        })
                }
            }
        })
    items.forEach((itemInfo, i) => {
        const itemDes = getItemDetails(itemInfo);
        const itemName = itemInfo.item.nameTag ? itemInfo.item.nameTag : formatString(itemInfo.item.id.split(':')[1]);
        form.button(itemInfo.slot, `§b${itemName}`, itemDes, itemInfo.item.id, itemInfo.item.amount, itemInfo.item.enchantments.length > 0, () => {
            if (playerInv.getItem(player.selectedSlot).typeId !== config.BackPackItemId) return player.sendMessage('§cYou can\'t move items from your inventory to your backpack')
            const recheckitems = Database.entries(itemStack).filter((data) => data[0].includes('BackPack:') && data[1]).map((data) => data[1]).filter((data) => data.page === Pages);
            if (recheckitems[i].slot !== itemInfo.slot) return player.sendMessage('§cThat item is no longer in that slot in your backpack')
            giveItem(player, itemInfo.item).then(() => {
                Database.delete(`BackPack:${itemInfo.slot}:${Pages}`, itemStack);
                playerInv.setItem(player.selectedSlot, itemStack);
                player.sendMessage('§aItem has been added to your inventory')
            })
        })
    })
    form.show(player, true)
}

/**
 * 
 * @param {Player} player 
 * @param {ItemStack} itemStack 
 * @param {number} slot 
 * @returns 
 */
async function addItemsBackPack(player, itemStack, slot = 1, Pages = 1) {
    let items = await getItems(player);
    if (items.length === 0) {
        return player.sendMessage('§cYou have no items in your inventory');
    }

    const playerInv = player.getComponent('inventory').container;

    if (playerInv.getItem(player.selectedSlot).typeId !== config.BackPackItemId) {
        return player.sendMessage('§cYou can\'t move items from your inventory to your backpack');
    }

    const form = new ChestForm().title(`§6Add Items To BackPack Slot: ${slot}`);
    items.forEach((itemInfo, index) => {
        const itemDes = getItemDetails(itemInfo);
        const itemName = itemInfo.item.nameTag ? itemInfo.item.nameTag : formatString(itemInfo.item.id.split(':')[1]);
        form.button(
            index + 1,
            `§b${itemName}`,
            itemDes,
            itemInfo.item.id,
            itemInfo.item.amount,
            itemInfo.item.enchantments.length > 0, () => {
                if (playerInv.getItem(player.selectedSlot).typeId !== config.BackPackItemId) return player.sendMessage('§cYou can\'t move items from your inventory to your backpack');
                if (playerInv.getItem(itemInfo.slot).typeId !== itemInfo.item.id) return player.sendMessage('§cYou dont have that item in your inventory anymore at that slot');
                if (Database.has(`BackPack:${slot}:${Pages}`, itemStack)) return player.sendMessage('§cThat item is already in that slot');
                playerInv.setItem(itemInfo.slot, undefined);
                itemInfo.slot = slot
                itemInfo.page = Pages
                Database.set(`BackPack:${slot}:${Pages}`, itemInfo, itemStack);
                playerInv.setItem(player.selectedSlot, itemStack);
                BackPack(player, itemStack, Pages);
            }
        );
    });
    form.button(0, '§cCancel', ['§7Click to cancel the operation'], 'minecraft:barrier', 1, false, () => BackPack(player, itemStack, Pages));
    form.show(player, true);
}
