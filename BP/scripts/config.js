export default {
    ScoreBoardName: 'Money', // The name of the scoreboard
    BackPackItemId: 'soulless:backpack', // The item id of the backpack
    BannedItemIds: [ // The ids of the banned items that can't be added to the backpack 
        'minecraft:bedrock',
        'minecraft:barrier',
        'minecraft:structure_void',
        'minecraft:command_block',
        'minecraft:repeating_command_block',
        'minecraft:chain_command_block',
        'minecraft:chest',
        'minecraft:trapped_chest',
        'soulless:backpack'
    ],
    Pages: { // The pages of the backpack and their prices
        default: 0, // The default page
        customPages: {
            '2': { // The Upgrade Name
                page: 2, // The page of the backpack
                price: 100 // The price of the upgrade
            },
            '3': {
                page: 3,
                price: 200
            },
            '4': {
                page: 4,
                price: 300
            },
            '5': {
                page: 5,
                price: 400
            },
            '6': {
                page: 6,
                price: 500
            },
            '7': {
                page: 7,
                price: 600
            },
            '8': {
                page: 8,
                price: 700
            },
            '9': {
                page: 9,
                price: 800
            },
            '10s': {
                page: 10,
                price: 900
            },
        }
    }
}
