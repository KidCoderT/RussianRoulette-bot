import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    userMention
} from 'discord.js';

class Manager {
    constructor(creator, punishment, bullets, guild, msg) {
        this.creator = creator;
        this.punishment = punishment;
        this.barrel = [0, 0, 0, 0, 0, 0];
        for (let i = 1; i <= bullets; i++) { this.barrel[i] = 1 }

        this.guild = guild;

        this.inviteMsg = msg
        this.inviteMsgData = {
            msg: ` - min ${1 + bullets} & max 6!\n - loser will be ${punishment}\n - {} player joined`,
            embed: new EmbedBuilder()
                .setColor(0xbc0002)
                .setTitle('Basic Russian Roulette'),
            // .setDescription(` - min 2 & max 6!\n - loser will be ${punishment}\n - 1 player joined`),
            row: new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${creator.toString()} j`)
                        .setStyle(ButtonStyle.Success)
                        .setLabel('Join!'),
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${creator.toString()} c`)
                        .setStyle(ButtonStyle.Danger)
                        .setLabel('Cancel!'),
                )
        };

        this.players = [creator];
        this.owner = creator;
        this.messages = [];
        this.canStart = false;
        this.state = "setup";
    }

    async updateInvite() {
        this.inviteMsgData.embed
            .setDescription(this.inviteMsgData.msg.replace("{}", this.players.length.toString()))

        if (this.players.length == 6) { this.inviteMsgData.row.components[0].setDisabled(true) }

        await this.inviteMsg.edit({
            content: `${userMention(this.owner)} made a new game!`,
            embeds: [this.inviteMsgData.embed],
            components: [this.inviteMsgData.row]
        })
            .then(console.log("updated successfully"))
            .catch(console.error);
    }

    async addPlayer(interaction) {
        let content = "";
        let canAdd = false;
        let canStart = false;

        if (interaction.user.id == this.guild.ownerId) {
            content = "you are the owner so to keep the game fair u cannot play!\nSry ☹"
        } else if (interaction.user.id == this.owner) {
            content = "You are the creator of the game!\nu cant join ur own game silly!"
        } else if (this.players.includes(interaction.user.id)) {
            content = "You are already in the game 👿"
        } else if (this.players.length == 6) {
            content = "The game is full no more players can join!"
        } else {
            content = "Added new player " + userMention(interaction.user.id) + " to Game!" //, ephemeral: true })
            canAdd = true;
        }

        if (canAdd) {
            this.messages.push(interaction.reply({ content: content }))
            this.players.push(interaction.user.id)
            // check if can start game
            this.canStart = this.players.length >= 1 + this.shotsLeft
            canStart = this.players.length == 1 + this.shotsLeft
        } else {
            interaction.reply({ content: content, ephemeral: true })
        }

        return canStart
    }

    cancelGame(interaction) {
        if (interaction.user.id == this.owner) {
            interaction.reply({ content: `${this.players.map(id => userMention(id)).join(" ")} deleted the game 😞` })
            this.messages.forEach(message => { try { message.delete() } catch { } })
            this.inviteMsg.unpin()
            this.inviteMsg.delete()
            return true
        }

        interaction.reply({ content: "u cant delete the game!", ephemeral: true })
        return false
    }

    punishPlayer(id) {
        if (this.punishment === "baned") {
            this.guild.members.ban(id)
        } else if (this.punishment === "kicked") {
            this.guild.members.kick(id)
        } else {
            guild.members.fetch(id)
                .then(member => member.timeout(120 * 60 * 1000, 'U Died Sucker!! 😈'))
                .catch(console.error)
        }
    }

    spinBarrel() {
        for (let i = 0; i < Math.floor(Math.random() * 40) + 3; i++) {
            let first = this.barrel.shift()
            this.barrel.push(first)
        }
    }

    get shotsLeft() { return this.barrel.reduce((a, b) => a + b, 0) }
}

export default Manager