import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    userMention,
    bold
} from 'discord.js';
import { setTimeout as wait } from 'timers/promises';
import { performance } from 'perf_hooks'

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
            row: [
                new ActionRowBuilder()
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
            ]
        };

        this.players = [creator];
        this.owner = creator;
        this.messages = [];
        this.canStart = false;
        this.state = "setup";
        this.turn = 0;
        this.timer = undefined;
        this.clickedBtn = false;
        this.playingMove = false
    }

    async updateInvite() {
        this.inviteMsgData.embed
            .setDescription(this.inviteMsgData.msg.replace("{}", this.players.length.toString()))

        if (this.players.length == 6) { this.inviteMsgData.row.components[0].setDisabled(true) }
        let rows = this.inviteMsgData.row;

        if (this.state == "setup") {
            await this.inviteMsg.edit({
                content: `${userMention(this.owner)} made a new game!`,
                embeds: [this.inviteMsgData.embed],
                components: rows
            })
                .catch(console.error);
        } else {
            await this.inviteMsg.edit({
                content: `${userMention(this.owner)} made a new game!`,
                embeds: [this.inviteMsgData.embed],
                components: []
            })
                .catch(console.error);
        }
    }

    async addPlayer(interaction) {
        let content = "";
        let canAdd = false;
        let canStart = false;

        if ((this.punishment === "kicked" && !interaction.member.kickable) || (this.punishment === "baned" && !interaction.member.bannable) || (this.punishment === "timed out" && !interaction.member.moderatable)) {
            content = "Bot doesn't have enough perms to punish u so u cant play!\n Sry!"
        } else if (interaction.member.id == this.guild.ownerId) {
            content = "you are the owner so to keep the game fair u cannot play!\nSry ☹"
        } else if (interaction.member.id == this.owner) {
            content = "You are the creator of the game!\nu cant join ur own game silly!"
        } else if (this.players.includes(interaction.member.id)) {
            content = "You are already in the game 👿"
        } else if (this.players.length == 6) {
            content = "The game is full no more players can join!"
        } else {
            content = "Added new player " + userMention(interaction.member.id) + " to Game!" //, ephemeral: true })
            canAdd = true;
        }

        if (canAdd) {
            this.messages.push(interaction.reply({ content: content }))
            this.players.push(interaction.member.id)
            this.canStart = this.players.length >= 1 + this.shotsLeft
            canStart = this.players.length == 1 + this.shotsLeft
        } else {
            interaction.reply({ content: content, ephemeral: true })
        }

        return canStart
    }

    async cancelGame(interaction) {
        if (interaction.member.id == this.owner) {
            await interaction.reply({ content: `${this.players.map(id => userMention(id)).join(" ")} deleted the game 😞` })
            this.messages.forEach(message => { try { message.delete() } catch { } })
            await this.inviteMsg.unpin()
            await this.inviteMsg.delete()
            return true
        }

        interaction.reply({ content: "u cant delete the game!", ephemeral: true })
        return false
    }

    async punishPlayer(id) {
        if (this.punishment === "baned") {
            console.log("banning the player")
            await this.guild.members.ban(id)
        } else if (this.punishment === "kicked") {
            console.log("kicking the player")
            await this.guild.members.kick(id)
        } else {
            console.log("timing out the player")
            await this.guild.members.fetch(id)
                .then(member => member.timeout(120 * 60 * 1000))
                .catch(console.error)
        }

        this.players.splice(this.players.findIndex(object => {
            return object == id;
        }), 1);
    }

    spinBarrel() {
        for (let i = 0; i < Math.floor(Math.random() * 40) + 3; i++) {
            let first = this.barrel.shift()
            this.barrel.push(first)
        }
    }

    randomizePlayers() {
        for (var i = this.players.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = this.players[i];
            this.players[i] = this.players[j];
            this.players[j] = temp;
        }
    }

    async messageRules(channel) {
        await channel.send(`${this.players.map(id => userMention(id)).join(" ")}`)
        await channel.send(
            "the game has now begun! the rules are simple, when its your turn\n"
            + "u will take the gun and fire yourself if u get shot u\n"
            + `get ${this.punishment}. but if u survive u pass it to the\n`
            + "next person. now they must choose whether to spin the\n"
            + "barrel again or just leave it. if they don't choose in time (12 seconds)\n"
            + `they will be ${this.punishment}! and the game goes on until\n`
            + "there are no more bullets in the barrel or only one person is left 😈"
        )

        await wait(1000)
    }

    async playTurn(channel, is_just_started = false) { // run asynchronously
        this.playingMove = true
        await channel.send(`Player ${this.turn + 1}: ${userMention(this.players[this.turn])}`)
        await wait(500)

        // if not just started ask for option
        if (!is_just_started) {
            let options = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${this.owner.toString()} sp`)
                        .setStyle(ButtonStyle.Success)
                        .setLabel('Spin Again?'),
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${this.owner.toString()} co`)
                        .setStyle(ButtonStyle.Primary)
                        .setLabel('Just Continue!'),
                )

            let optionsMsg = await channel.send({
                content: `${userMention(this.players[this.turn])} select your option`, components: [options]
            })


            this.timer = performance.now()
            this.clickedBtn = false

            let wait_time = 12000

            while (performance.now() - this.timer < wait_time && !this.clickedBtn) {
                await wait(1)
            }

            options.components[0].setDisabled(true)
            options.components[1].setDisabled(true)

            await optionsMsg.edit({
                content: `${userMention(this.players[this.turn])} select your option`, components: [options]
            })

            if (!this.clickedBtn && performance.now() - this.timer >= wait_time) {
                await channel.send(`Player ${this.turn + 1} was hesitated to play and so will be punished 😈`)
                await this.punishPlayer(this.players[this.turn])

                if (this.players.length == 1) {
                    this.state = "game over"
                }

                return
            }
        }

        await channel.send("u pick up the gun.")
        await wait(200)
        let message = await channel.send("3 .. ")
        await wait(500)
        await message.edit("3 .. 2 ..")
        await wait(500)
        await message.edit("3 .. 2 .. 1 ..")
        await wait(500)
        await message.edit(`3 .. 2 .. 1 .. ${bold('BANG!')}`)
        await wait(1000)

        let chamber_value = this.barrel.shift()
        this.barrel.push(0)

        if (chamber_value === 1) {
            this.punishPlayer(this.players[this.turn])
            await channel.send("U died 😈!")
            await wait(200)
            await channel.send(`Player has been ${this.punishment}!`)

            let remainingBullets = this.shotsLeft
            await channel.send(`there are ${remainingBullets} bullets left!`)

            if (remainingBullets === 0 || this.players.length == 1) {
                this.state = "game over"
                return
            }

            this.turn -= 1
        } else {
            await channel.send("U survived 👿!")
            await wait(500)
        }

        this.turn += 1

        if (this.turn >= this.players.length) {
            this.turn = 0
        }

        this.playingMove = false
    }


    get shotsLeft() { return this.barrel.reduce((a, b) => a + b, 0) }
}

export default Manager