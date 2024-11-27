import styles from "@/app/game/components/componentStyles/startQuestions.module.css"
import { useState } from "react";
const StartQuestions = ({ beginWithSelectedRound }: {
    beginWithSelectedRound: (round:number) => void
}) => {
    const [round, setRound] = useState<number>(3);
    return (
        <div className={styles.container}>
            <h2 className={styles.h2}>select number of round you want to play</h2>
            <div className={styles.buttons}>
                <p className={styles.p}>selected <span>{round}</span> rounds</p>
                <button
                    style={{
                        border: round === 3 ? '8px solid green' : '8px solid transparent'
                    }}
                    onClick={() => setRound(3)}
                >
                    3 rounds
                </button>
                <button
                    style={{
                        border: round === 5 ? '8px solid green' : '8px solid transparent'
                    }}
                    onClick={() => setRound(5)}
                >
                    5 rounds
                </button>
                <button
                    style={{
                        border: round === 7 ? '8px solid green' : '8px solid transparent'
                    }}
                    onClick={() => setRound(7)}
                >
                    7 rounds
                </button>
                <button
                    className={styles.btn_begin}
                    onClick={() => beginWithSelectedRound(round)}
                >
                    lets begin
                </button>
            </div>
        </div>
    );
}

export default StartQuestions;