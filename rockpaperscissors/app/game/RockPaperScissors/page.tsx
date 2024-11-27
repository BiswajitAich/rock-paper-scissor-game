"use client"
import Image from "next/image";
import styles from "@/app/styles/rockpaperscissors.module.css"
import controller from "@/public/images/game-controller.png"
import dynamic from "next/dynamic";
import { useState } from "react";
const StartContainer = dynamic(() => import("@/app/game/components/StartContainer"))
const StartQuestions = dynamic(() => import("@/app/game/components/StartQuestions"))
const GameTime = dynamic(() => import("@/app/game/components/GameTime"))
const Vs = dynamic(() => import("@/app/game/components/Vs"))
const WinnerDeclaration = dynamic(() => import("@/app/game/components/WinnerDeclaration"))
interface GameScore {
    human: number;
    ai: number;
    winner: string;
}
const RockPaperScissors = () => {
    const [displayState, setDisplayState] = useState<string>("start")
    const [selectedRound, setSelectedRound] = useState<number>(3)
    const [scores, setScores] = useState<GameScore>({
        human: 0,
        ai: 0,
        winner: ""
    })

    const handleFlagChange = () => {
        setDisplayState("start-questions")
    };
    const handleSelectedRounds = (round: number) => {
        setSelectedRound(round)
        setDisplayState("vs");
        setTimeout(() => {
            setDisplayState("game-time");
        }, 3000);
    };
    const handleGameScore = (scores: GameScore) => {
        setDisplayState("winner-declaration")
        setScores(scores)
        // setTimeout(() => {
        //     setDisplayState("start");
        // }, 3000);
    };

    return (
        <main className={styles.main}>
            <div className={styles.start_container}>
                {displayState === "start" ? <StartContainer sendFlag={handleFlagChange} /> : null}
                {displayState === "start-questions" ? <StartQuestions beginWithSelectedRound={handleSelectedRounds} /> : null}
                {displayState === "vs" ? <Vs /> : null}
                {displayState === "game-time" ? <GameTime selectedRound={selectedRound} sendgameScores={handleGameScore}/> : null}
                {displayState === "winner-declaration" ? <WinnerDeclaration scores={scores} playAgain={setDisplayState}/> : null}
            </div>
            <Image
                src={controller}
                height={500}
                width={500}
                alt=""
                className={styles.controller}
            />
        </main>
    );
}

export default RockPaperScissors;