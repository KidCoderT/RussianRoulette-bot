import { SlashCommandBuilder } from '@discordjs/builders';

const commandNames = {
    New: "new",
    Start: "start",
    Info: "info"
}

const newGameCommand = new SlashCommandBuilder()
    .setName(commandNames.New)
    .setDescription('create a new game')
    .addStringOption((option) =>
        option
            .setName('punishment')
            .setDescription('What punishment should be done on the loser?')
            .addChoices(
                { name: 'Ban', value: 'baned' },
                { name: 'Kick', value: 'kicked' },
                { name: 'Timeout', value: 'timed out' },
            )
            .setRequired(true)
    )
    .addIntegerOption((option) =>
        option
            .setName('shots')
            .setDescription('Number of shots in the barrel?')
            .setMinValue(1)
            .setMaxValue(2)
            .setRequired(true)
    );

// start
const startGameCommand = new SlashCommandBuilder()
    .setName(commandNames.Start)
    .setDescription('start a new game');

// info
const gameInfoCommand = new SlashCommandBuilder()
    .setName(commandNames.Info)
    .setDescription('how to use the bot?');

const commands = [newGameCommand, startGameCommand, gameInfoCommand].map(command => command.toJSON());
export { commands, commandNames }