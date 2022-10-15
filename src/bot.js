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
import { setTimeout as wait } from 'timers/promises';


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
let game = {
    basic: undefined,
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
    // if (!interaction.isChatInputCommand()) return

    if (interaction.isCommand()) {
        if (interaction.commandName === commandNames.New) {
            // check if not owner
            if (interaction.guild.ownerId === interaction.user.id) {
                await interaction.reply({ content: "Sry but u cant play as it will be unfair because u the server owner.\nPlay using a second account.", ephemeral: true })
            } else if (game.basic !== undefined) {
                await interaction.reply({ content: "A game is already in progress!\nEither join that or wait until its over to start a new game.", ephemeral: true })
            } else {
                let botServerId = checkChannelPresent(interaction.guild)

                await interaction.reply(`New game made 😈!\nHead over to the ${channelMention(botServerId)}>`)
                await interaction.followUp({ content: `${userMention(interaction.user.id)} invite other members to join!`, ephemeral: true })

                let punishment = interaction.options.get('punishment').value;
                let shots = interaction.options.get('shots').value;

                let msg = await interaction.guild.channels.fetch(botServerId)
                    .then(channel => channel.send({
                        content: `hello`,
                    }))

                await msg.pin()

                let newGame = new Manager(interaction.user.id, punishment, shots, interaction.guild, msg)
                await newGame.updateInvite()
                game.basic = newGame;
            }
        }

        if (interaction.commandName === commandNames.Start) {
            if (game.basic === undefined) {
                interaction.reply({ content: "There is no game made to be started! 😂" })
                return
            }

            // check if the user is the game owner
            if (interaction.user.id !== game.basic.owner) {
                interaction.reply({ content: "u are not the owner and so cant start the game!\n tell the owner to start the game!!" })
                return
            }

            // check if can start the game
            if (!game.basic.canStart) {
                interaction.reply({ content: "There are not enough people to start the game!\n ask more people to join!" })
                return
            }

            // start the game
            await interaction.reply({ content: "Starting Game!" });
            game.basic.state = "playing"

            while (game.basic.inviteMsgData.row.components.length > 0) {
                game.basic.inviteMsgData.row.components.pop()
            }

            await game.basic.updateInvite()

            await game.basic.messageRules(interaction.channel);
            await wait(1000);
            await interaction.channel.send("… Randomizing Players");
            game.basic.randomizePlayers();
            await wait(1000);
            await interaction.channel.send("… Spinning Barrel");
            game.basic.spinBarrel();
            await wait(500);

            // todo: create run player
            game.basic.playTurn(interaction.channel, true)

            while (game.basic.state != "game over") {
                await interaction.channel.send("moving to the next player");
                game.basic.playTurn(interaction.channel)
            }

            await interaction.channel.send("Game Over");
            await interaction.channel.send("Thx for playing!");
        }
    }

    if (interaction.isButton()) {
        let [id, options] = interaction.customId.split(" ");
        let data = game.basic;

        if (data === undefined) { return }

        // todo: make sure that the option is in correct interaction

        if (options === "j") {
            // join new person
            let canStart = await data.addPlayer(interaction);
            if (canStart) { await interaction.channel.send({ content: `${userMention(data.owner.toString())} you can now start the game! 😈`, ephemeral: true }) }
            await data.updateInvite()
        } else if (options === "c") {
            // cancel the game
            let canceled = data.cancelGame(interaction);
            if (canceled) {
                game.basic = undefined
            }
        } else if (options === "sp") {
            // todo: make sure the user is the current player
            await interaction.reply("… Spining Barrel")
            game.basic.spinBarrel();
            game.basic.clickedBtn = true;
        } else if (options === "co") {
            // todo: make sure the user is the current player
            await interaction.reply("Just continuing with current gun!")
            game.basic.clickedBtn = true;
        }
    }
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