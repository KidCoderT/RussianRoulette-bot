import { SlashCommandBuilder } from '@discordjs/builders';

const newGameCommand = new SlashCommandBuilder()
    .setName('new')
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
            .setAutocomplete(true)
            .setRequired(true)
    );

// start

const commands = [newGameCommand];

export default commands.map(command => command.toJSON())