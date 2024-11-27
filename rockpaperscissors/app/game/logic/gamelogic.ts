class GameLogic {
    private round: number;
    private humanWins: number = 0;
    private aiWins: number = 0;

    constructor(round: number = 3) {
        this.round = round;
    }

    private decrementRound() {
        if (this.round > 0) {
            this.round--;
        }
    }

    private determineOutcome(ai: string, human: string): number {
        ai = ai.toLowerCase();
        human = human.toLowerCase();
        // 0: loss, 1: win, 2: draw, 3: error
        try {
            if (ai === human) return 2;
            else if (ai === "rock" && human === "paper") return 1;
            else if (ai === "rock" && human === "scissors") return 0;
            else if (ai === "paper" && human === "rock") return 0;
            else if (ai === "paper" && human === "scissors") return 1;
            else if (ai === "scissors" && human === "rock") return 1;
            else if (ai === "scissors" && human === "paper") return 0;
            else return 3;
        } catch (error) {
            return 3;
        }
    }

    private updateScore(result: number) {
        if (result === 1) this.humanWins++;
        else if (result === 0) this.aiWins++;
    }

    public playRound(ai: string, human: string): string {
        const result = this.determineOutcome(ai, human);
        this.updateScore(result);
        this.decrementRound();

        if (result === 0) return "lose"; // AI wins
        if (result === 1) return "win"; // Human wins
        if (result === 2) return "draw";
        return ""; 
    }

    public getRemainingRounds(): number {
        return this.round;
    }

    public getScores(): { human: number; ai: number; winner: string } {
        return { 
            human: this.humanWins, 
            ai: this.aiWins, 
            winner: this.aiWins > this.humanWins ? "ai" : (this.humanWins > this.aiWins ? "you" : "draw")
        };
    }
}

export default GameLogic;
