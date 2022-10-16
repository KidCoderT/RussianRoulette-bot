import {
    Client,
    IntentsBitField,
    ChannelType,
    Routes,
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

function getBotServerId(guild) {
    let result = undefined;

    guild.channels.cache.forEach((channel) => {
        if (channel.name == botChannelName) {
            result = channel.id;
        }
    })

    return result;
}

function checkChannelPresent(guild) {
    let id = getBotServerId(guild)
    if (id != undefined) {
        return id;
    }

    let channel = guild.channels.create(
        {
            name: botChannelName,
            reason: 'Bot channel',
            type: ChannelType.GuildText,

        })
        .catch(console.error);

    return channel.id
}

async function runGame(channel) {
    await game.basic.playTurn(channel, true)

    while (game.basic.state != "game over") {
        if (!game.basic.playingMove) {
            await channel.send("moving to the next player");
            await wait(500)
            await game.basic.playTurn(channel)
            await wait(2000)
        }
    }

    await channel.send("Game Over");
    await channel.send("Thx for playing!");

    game.basic = undefined
}

// runs only once
client.once('ready', () => {
    client.guilds.cache.forEach((guild) => {
        if (getBotServerId(guild) === undefined) {
            guild.channels.create(
                {
                    name: botChannelName,
                    reason: 'Bot channel',
                    type: ChannelType.GuildText,

                })
                .catch(console.error);
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
            let punishment = interaction.options.get('punishment').value;
            let shots = interaction.options.get('shots').value;

            if (interaction.guild.ownerId === interaction.member.id) {
                await interaction.reply({ content: "Sry but u cant play as it will be unfair because u the server owner.\nPlay using a second account.", ephemeral: true })
            } else if (game.basic !== undefined) {
                await interaction.reply({ content: "A game is already in progress!\nEither join that or wait until its over to start a new game.", ephemeral: true })
            } else if ((punishment === "kicked" && !interaction.member.kickable) || (punishment === "baned" && !interaction.member.bannable) || (punishment === "timed out" && !interaction.member.moderatable)) {
                await interaction.reply({ content: "Bot doesn't have enough perms to punish u so u cant play!\n Sry!", ephemeral: true })
            } else {
                let botServerId = checkChannelPresent(interaction.guild)

                await interaction.reply(`New game made 😈!\nHead over to the ${channelMention(botServerId)}>`)
                await interaction.followUp({ content: `${userMention(interaction.member.id)} invite other members to join!`, ephemeral: true })


                let msg = await interaction.guild.channels.fetch(botServerId)
                    .then(channel => channel.send({
                        content: `hello`,
                    }))

                await msg.pin()

                let newGame = new Manager(interaction.member.id, punishment, shots, interaction.guild, msg)
                await newGame.updateInvite()
                game.basic = newGame;
            }
        }

        if (interaction.commandName === commandNames.Start) {
            if (game.basic === undefined) {
                interaction.reply({ content: "There is no game made to be started! 😂" })
                return
            } else if (interaction.member.id !== game.basic.owner) {
                interaction.reply({ content: "u are not the owner and so cant start the game!\n tell the owner to start the game!!" })
                return
            } else if (!game.basic.canStart) {
                interaction.reply({ content: "There are not enough people to start the game!\n ask more people to join!" })
                return
            }

            // start the game
            await interaction.reply({ content: "Starting Game!" });
            game.basic.state = "playing"

            game.basic.inviteMsgData.row = undefined

            await game.basic.updateInvite()

            await game.basic.messageRules(interaction.channel);
            await wait(1000);
            await interaction.channel.send("… Randomizing Players");
            game.basic.randomizePlayers();
            await wait(1000);
            await interaction.channel.send("… Spinning Barrel");
            game.basic.spinBarrel();
            console.log(game.basic.barrel)
            await wait(500);

            runGame(interaction.channel)
        }
    }

    if (interaction.isButton()) {
        let [id, options] = interaction.customId.split(" ");
        let data = game.basic;

        if (data === undefined) { return }

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
        }

        if (data.state == "playing") {
            if (interaction.member.id == data.players[data.turn]) {
                if (options === "sp") {
                    await interaction.reply("… Spinning Barrel")
                    game.basic.spinBarrel();
                    game.basic.clickedBtn = true;
                } else if (options === "co") {
                    await interaction.reply("Just continuing with current gun!")
                    game.basic.clickedBtn = true;
                }
            } else if (data.players.includes(interaction.member.id)) {
                await interaction.reply({ content: "Its not your turn !", ephemeral: true })
            } else {
                await interaction.reply({ content: "Your not in this game !", ephemeral: true })
            }
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