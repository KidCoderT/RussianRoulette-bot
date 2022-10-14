import {
    Client,
    IntentsBitField,
    ChannelType,
    Routes,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} from 'discord.js';


import { REST } from '@discordjs/rest';
import { BasicGame } from "./game.js";
import commands from "./commands.js"

import dotenv from 'dotenv';
dotenv.config()

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID; // only for testing

const botIntents = new IntentsBitField();
botIntents.add(
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.GuildEmojisAndStickers,
);

const client = new Client({ intents: botIntents });

const botChannelName = "🔫-russian-roulette-😈";
const rest = new REST({ version: '10' }).setToken(TOKEN);

const GameTypes = {
    Basic: 1, // basic game with kicking and banning
    Challenge: 2, // challenge another person with money
    Multiplayer: 3, // multiplayer game with money
};

let users = {}; // contains the user id and their score
let games = {
    "BasicGames": {},
    "Challenges": {},
    "MultiplayerGames": {}
}; // contains the games being played or just made
let botChannelID = {}; // contains the id of the bot channel

function getBotServerId(guild) {
    let result = undefined;

    guild.channels.cache.forEach((channel) => {
        if (channel.name == botChannelName) {
            botChannelID[guild.id] = channel.id
            result = channel.id;
        }
    })

    return result;
}

function checkChannelPresent(botChannelID, guild) {
    if (guild.channels.cache.some(channel => channel.id == botChannelID)) {
        return botChannelID;
    }

    let channel = guild.channels.create(
        {
            name: botChannelName,
            reason: 'Bot channel',
            type: ChannelType.GuildText,

        })
        .then(console.log)
        .catch(console.error);

    botChannelID[guild.id] = channel.id
    return channel.id
}

// runs only once
client.once('ready', () => {
    client.guilds.cache.forEach((guild) => {
        if (getBotServerId(guild) === undefined) {
            let channel = guild.channels.create(
                {
                    name: botChannelName,
                    reason: 'Bot channel',
                    type: ChannelType.GuildText,

                })
                .then(console.log)
                .catch(console.error);

            botChannelID[guild.id] = channel.id
        }

    })

    console.log('Bot is Ready!');
});

// run on interaction
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'new') {
        // check if not owner
        if (interaction.guild.ownerId === interaction.user.id) {
            await interaction.reply({ content: "Sry but u cant play as it will be unfair because u the server owner.\nPlay using a second account.", ephemeral: true })
        } else {
            let botServerId = checkChannelPresent(botChannelID[interaction.guild.id], interaction.guild)

            await interaction.reply(`New game made 😈!\nHead over to the <#${botServerId}>`)
            await interaction.followUp({ content: `<@${interaction.user.id}> invite other members to join!`, ephemeral: true })

            let punishment = interaction.options.get('punishment').value;
            let shots = interaction.options.get('shots').value;

            const embed = new EmbedBuilder()
                .setColor(0xbc0002)
                .setTitle('Basic Russian Roulette')
                .setDescription(` - min 2 & max 6!\n - loser will be ${punishment}\n - 1 player joined`);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${interaction.user.id} BasicGames j`)
                        .setStyle(ButtonStyle.Success)
                        .setLabel('Join!'),
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${interaction.user.id} BasicGames c`)
                        .setStyle(ButtonStyle.Danger)
                        .setLabel('Cancel!'),
                )

            let msg = await interaction.guild.channels.fetch(botServerId)
                .then(channel => channel.send({
                    content: `<@${interaction.user.id}> made a new game!`,
                    embeds: [embed], components: [row]
                }))

            // todo: check no game made previously
            let newGame = new BasicGame(shots, punishment, interaction.user.id, `<@${interaction.user.id}> made a new game!`, embed, row, msg)
            games["BasicGames"][interaction.user.id] = newGame;
        }
    }

    if (interaction.isButton()) {
        let [id, gameType, options] = interaction.customId;
        let data = games[gameType][id];

        // todo: add state management

        if (gameType === "BasicGames") {
            if (data.isPlaying) {

            } else {
                if (options === "c") {
                    if (interaction.user.id == id) {
                        interaction.reply(`${data.} Game Canceled!`)
                    } else {
                        interaction.reply("u cant do that!")
                    }
                }
            }
        }
    }
});

async function main() {
    try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
            body: commands,
        });

        client.login(TOKEN);
    } catch (err) {
        console.log(err);
    }
}

main();