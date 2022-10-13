import { SlashCommandBuilder } from '@discordjs/builders';

const pingCommand = new SlashCommandBuilder()
    .setName('test')
    .setDescription('Check');

const commands = [pingCommand];

export default commands.map(command => command.toJSON())