import dance from "@/public/images/dance.gif"
import tease from "@/public/images/tease.gif"
import Image from "next/image";
import styles from "@/app/game/components/componentStyles/winnerDeclaration.module.css"
interface GameScore {
    human: number;
    ai: number;
    winner: string;
}
const WinnerDeclaration = ({ scores, playAgain }: { scores: GameScore, playAgain:(play:string)=>void }) => {
    return (
        <div>
            <h1 className={styles.h1}>! Scores !</h1>
            <h2 className={styles.h2}>...<span style={{ color: "greenyellow" }}>{scores.winner}</span> won...</h2>
            <div className={styles.p_div}>
                <p>ai scored: <span>{scores.ai}</span></p>
                <p>you scored: <span>{scores.human}</span></p>
            </div>
            <div className={styles.img_Div}>
                {scores.winner !== "you" ?
                    <Image
                        src={dance}
                        sizes="(min-width: 768px) 300px, 150px"
                        layout="responsive"
                        objectFit="cover"
                        priority={false}
                        loading="lazy"
                        alt="dance"
                    />
                    :
                    <Image
                        src={tease}
                        sizes="(min-width: 768px) 300px, 150px"
                        layout="responsive"
                        objectFit="cover"
                        priority={false}
                        loading="lazy"
                        alt="tease"
                    />
                }
            </div>
            {scores.winner === "you" ?
                <p className={styles.p}>well played</p>
                :
                <p className={styles.p}>better luck next time</p>
            }
            <button className={styles.button} onClick={()=>playAgain("start-questions")}>play again</button>
        </div>
    );
}

export default WinnerDeclaration;