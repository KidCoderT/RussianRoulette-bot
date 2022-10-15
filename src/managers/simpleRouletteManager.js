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
        this.turn = 0;
        this.timer = undefined;
        this.clickedBtn = false;
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
        let currentIndex = this.players.length, randomIndex;

        // While there remain elements to shuffle.
        while (currentIndex != 0) {

            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [this.players[currentIndex], this.players[randomIndex]] = [
                this.players[randomIndex], this.players[currentIndex]];
        }
    }

    async messageRules(channel) {
        await channel.send(`${this.players.map(id => userMention(id)).join(" ")}`)
        await channel.send(
            "the game has now begun! the rules are simple, when its your turn\n"
            + "u will take the gun and fire yourself if u get shot u"
            + `get ${this.punishment}. but if u survive u pass it to the`
            + "next person. now they must choose whether to spin the\n"
            + "barrel again or just leave it. if they don't choose in time"
            + `they will be ${this.punishment}! and the game goes on until`
            + "there are no more bullets in the barrel or only one persons left 😈"
        )
    }

    async playTurn(channel, is_just_started = false) { // run asynchronously
        await channel.send(`Player ${this.turn + 1}: ${userMention(this.players[this.turn])}`)

        // if not just started ask for option
        if (is_just_started) {
            let options = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${creator.toString()} sp`)
                        .setStyle(ButtonStyle.Success)
                        .setLabel('Spin Again?'),
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${creator.toString()} co`)
                        .setStyle(ButtonStyle.Primary)
                        .setLabel('Just Continue!'),
                )

            let optionsMsg = await channel.send({
                content: `${userMention(this.players[this.turn])} select your option`, components: [options]
            })


            this.timer = performance.now()
            this.clickedBtn = false

            while (performance.now() - this.timer >= 8000 && !this.clickedBtn) {
                await wait(1)
            }

            options.components[0].setDisabled(true)
            options.components[1].setDisabled(true)

            await optionsMsg.edit({
                content: `${userMention(this.players[this.turn])} select your option`, components: [options]
            })

            if (!this.clickedBtn && performance.now() - this.timer >= 8000) {
                await channel.send(`Player ${this.turn + 1} was hesitated to play and so will be punished 😈`)
                this.punishPlayer(this.players[this.turn])

                if (this.players.length == 0) {
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
        await wait(500)

        let chamber_value = this.barrel.shift()
        this.barrel.push(0)

        if (chamber_value === 1) {
            await channel.send("U died 😈!")
            await wait(200)
            this.punishPlayer(this.players[this.turn])
            await channel.send(`Player has been ${this.punishment}!`)

            let remainingBullets = this.shotsLeft
            await channel.send(`there are ${remainingBullets} bullets left!`)

            if (remainingBullets === 0 || this.players.length == 0) {
                this.state = "game over"
                return
            }

            this.turn -= 1
        } else {
            await channel.send("U survived 👿!")
            await wait(200)
        }

        this.turn += 1
    }


    get shotsLeft() { return this.barrel.reduce((a, b) => a + b, 0) }
}

export default Manager