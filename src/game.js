
class MsgManager {
    constructor(text, embed, row, message) {
        this.message = message;
        this.embed = embed;
        this.row = row;
        this.text = text;
    }

    update_message() {
        this.message.edit({
            content: this.text,
            embeds: [this.embed], components: [this.row]
        })
    }
}

class BasicGame {
    constructor(shots, punishment, creator, text, embed, row, message) {
        this.setupMsg = MsgManager(text, embed, row, message)
        this.punishment = punishment;
        this.owner = creator;
        this.players = [creator];

        this.barrel = [0, 0, 0, 0, 0, 0];
        for (let i = 0; i >= shots; i++) { this.barrel[i] = 1 }

        this.turn = 0;
        this.canStart = false;
        this.isPlaying = false;
    }

    spinBarrel() {
        for (let i = 0; i <= Math.floor(Math.random() * 20); i++) {
            let section = this.barrel.shift();
            this.barrel.push(section);
        }
    }

    randomizePlayerOrder() {
        this.players.sort(() => Math.random() - 0.5);
    }

    addPlayer(id) {
        this.players.push(id)
        this.setupMsg.text = ` - min 2 & max 6!\n - loser will be ${punishment}\n - ${this.players.length} players joined`
        this.canStart = (this.players.length >= 2);
    }

    startGame() {
        if (!this.canStart) {
            return false
        }

        spinBarrel()
        randomizePlayerOrder()
    }

    shoot() {
        let result = this.barrel.shift();
        let died = result === 1;
        this.barrel.push(0)
        return died
    }

    gameOver() {
        return this.barrel.reduce((a, b) => a + b, 0) == 0
    }
}

export {
    BasicGame
}