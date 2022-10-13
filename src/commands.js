import { SlashCommandBuilder } from '@discordjs/builders';

const newGameCommand = new SlashCommandBuilder()
    .setName('new')
    .setDescription('create a new game')
    .addStringOption((option) =>
        option
            .setName('punishment')
            .setDescription('What punishment should be done on the loser?')
            .addChoices(
                { name: 'Ban', value: 'ban' },
                { name: 'Kick', value: 'kick' },
                { name: 'Timeout', value: 'timeout' },
            )
            .setRequired(true)
    )
    .addIntegerOption((option) =>
        option
            .setName('bullets')
            .setDescription('Number of bullets in the barrel?')
            .setMinValue(1)
            .setMaxValue(4)
            .setRequired(true)
    );

const commands = [newGameCommand];

export default commands.map(command => command.toJSON())