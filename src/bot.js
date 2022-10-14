import {
    Client,
    IntentsBitField,
    ChannelType,
    Routes,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    channelMention,
    userMention
} from 'discord.js';


import { REST } from '@discordjs/rest';
import { commands, commandNames } from "./commands.js"
import Manager from "./managers/simpleRouletteManager.js";

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

// contains the games being played or just made
let games = {
    basic: {},
};
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

function checkChannelPresent(guild) {
    if (guild.channels.cache.some(channel => channel.id == botChannelID[guild.id])) {
        return botChannelID[guild.id];
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
    client.on('interactionCreate', async interaction => {
        if (!interaction.isChatInputCommand()) return;

        if (interaction.commandName === commandNames.New) {
            // check if not owner
            if (interaction.guild.ownerId === interaction.user.id) {
                await interaction.reply({ content: "Sry but u cant play as it will be unfair because u the server owner.\nPlay using a second account.", ephemeral: true })
            } else {
                let botServerId = checkChannelPresent(interaction.guild)

                await interaction.reply(`New game made 😈!\nHead over to the ${channelMention(botServerId)}>`)
                await interaction.followUp({ content: `<@${interaction.user.id}> invite other members to join!`, ephemeral: true })

                let punishment = interaction.options.get('punishment').value;
                let shots = interaction.options.get('shots').value;

                let msg = await interaction.guild.channels.fetch(botServerId)
                    .then(channel => channel.send({
                        content: `hello`,
                    }))

                // let newGame = new Manager(interaction.user.id, punishment, shots, interaction.guild, msg)
                // games.basic[interaction.user.id] = newGame;
            }
        }

        if (interaction.isButton()) {
            let [id, options] = interaction.customId;
            let data = games.basic[id];

            // todo: add state management
            if (data.state === "setup") {
                if (options === "j") {
                    // join new person
                    data.addPlayer(interaction);
                    data.updateInvite()
                } else if (options === "c") {
                    // cancel the game
                    let canceled = data.cancelGame(interaction);
                    if (canceled) { games.basic.delete(id) }
                }
            }

        }
    });
});

export default async (token, client_id) => {
    try {
        const rest = new REST({ version: '10' }).setToken(token);
        await rest.put(Routes.applicationCommands(client_id), {
            body: commands,
        });

        client.login(token);
    } catch (err) { console.log(err) }
}