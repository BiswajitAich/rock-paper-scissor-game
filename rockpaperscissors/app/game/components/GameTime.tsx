import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import rock from "@/public/images/rock.png";
import paper from "@/public/images/paper.png";
import scissors from "@/public/images/scissors.png";
import r_p_s from "@/public/images/rock-paper-scissors-gif.gif";
import styles from "@/app/game/components/componentStyles/gameTime.module.css";
import GameLogic from "@/app/game/logic/gamelogic";
interface GameScore {
    human: number;
    ai: number;
    winner: string;
}
const GameTime = (
    { selectedRound, sendgameScores }:
        {
            selectedRound: number,
            sendgameScores: (score: GameScore) => void
        }
) => {
    const [rounds, setRounds] = useState<number[]>([selectedRound, selectedRound]);
    const [aiSelected, setAiSelected] = useState<string>("r_p_s");
    const [humanSelected, setHumanSelected] = useState<string>("r_p_s");
    // const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [counting, setCounting] = useState<number | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraStarted, setCameraStarted] = useState(false);
    const [modelResponseFlag, setModelResponseFlag] = useState<string>("none");
    const [winner, setWinner] = useState<string[]>([]);
    const [gameOver, setGameOver] = useState<boolean>(false);

    const gameRef = useRef<GameLogic>(new GameLogic(selectedRound));
    useEffect(() => {
        // Reset the game if a new round is selected
        gameRef.current = new GameLogic(selectedRound);
        setRounds([selectedRound, selectedRound]);
    }, [selectedRound]);

    const handleCamera = async () => {
        if (cameraStarted) return;
        setGameOver(true)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 640,
                    height: 640,
                },
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch((error) => {
                    console.error("Error playing video:", error);
                });
                setCameraStarted(true);
            } else {
                handleCamera()
            }

            setHumanSelected("cam");
            console.log("cam");

        } catch (err) {
            console.error("Error accessing camera:", err);
            setHumanSelected("r_p_s");
            alert("Could not access camera. Please check permissions.");
        }
    };

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;

            if (video.videoWidth === 0 || video.videoHeight === 0) {
                console.error("Video dimensions not loaded");
                return;
            }

            canvas.width = 640;
            canvas.height = 640;

            const context = canvas.getContext("2d");
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                const dataUrl = canvas.toDataURL("image/jpeg");
                sendData(dataUrl)
                // setCapturedImage(dataUrl);
            }
        }
    };

    const stopVideoFeed = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        } else {
            console.log("No active stream to stop.");
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setCameraStarted(false);
        setHumanSelected("captured");
        setGameOver(false)
    };


    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;
        let interval: NodeJS.Timeout | null = null;
        if (cameraStarted) {
            setCounting(3);
            interval = setInterval(() => {
                setCounting((prev: number | null) => {
                    if (prev === null) return null
                    if (prev <= 1) {
                        clearInterval(interval!); // Stop interval when countdown finishes
                        return prev; // Prevent further decrements
                    }
                    return prev - 1; // Decrement countdown
                });
            }, 1000);
            timer = setTimeout(() => {
                captureImage();
                stopVideoFeed();
                setCounting(null)
            }, 3000);
        }

        return () => {
            if (timer) clearTimeout(timer);
            if (interval) clearInterval(interval);
        };
    }, [cameraStarted]);
    const generateChoice = () => {
        const choices = ["rock", "paper", "scissors"];
        const randomIndex = Math.floor(Math.random() * choices.length);
        return choices[randomIndex];
    };
    const sendData = async (imageData: string) => {
        try {
            setGameOver(true)
            const base = window.location.origin || "https://rock-paper-scissor-game-by-yolo.vercel.app";            
            console.log(`${base}/api/prediction`);
            
            const response = await fetch(`${base}/api/prediction`, {
                method: "POST",
                body: createFormData(imageData),
                cache: 'no-cache'
            });
            
            
            if (!response.ok) {
                console.error("Error response from API:", response.status, response.statusText);
                setAiSelected('r_p_s')
                setHumanSelected('r_p_s')
                setWinner(["", ""])
                setGameOver(false)
                return;
            }
            const data = await response.json();
            console.log(data.result);

            const r = data.data
            console.log("---r---" + r);

            if (r === "none") {
                setAiSelected('r_p_s')
                setHumanSelected('r_p_s')
                setWinner(["", ""])
                setGameOver(false)
                return
            }
            setAiSelected(generateChoice())
            setModelResponseFlag(r)
            setHumanSelected(r)
            setGameOver(false)
            console.log("API Response:", data);
        } catch (error) {
            console.error("Error sending to Flask:", error);
        }
    };
    useEffect(() => {
        if (modelResponseFlag !== "none") handelGame();
    }, [modelResponseFlag])

    const handelGame = () => {
        const res = gameRef.current.playRound(aiSelected, humanSelected)
        if (res === "win") setWinner(["lose", res])
        else if (res === "lose") setWinner(["win", res])
        else setWinner([res, res])
        setRounds(prev => [prev[0], gameRef.current.getRemainingRounds()])
        if (gameRef.current.getRemainingRounds() === 0) {
            setTimeout(() => sendgameScores(gameRef.current.getScores()), 3000);
            setGameOver(true)
        }
    }
    const createFormData = (imageData: string) => {
        const formData = new FormData();
        const blob = dataURLToBlob(imageData);
        formData.append("image", blob, "image.jpg");
        return formData;
    };

    const dataURLToBlob = (dataUrl: string): Blob => {
        let arr = dataUrl.split(",");
        let mimeMatch = arr[0].match(/:(.*?);/);

        if (!mimeMatch) {
            throw new Error("Invalid data URL format");
        }

        let mime = mimeMatch[1];
        let bstr = atob(arr[1]);
        let n = bstr.length;
        let u8arr = new Uint8Array(n);

        while (n--) u8arr[n] = bstr.charCodeAt(n);

        return new Blob([u8arr], { type: mime });
    };

    return (
        <div>
            <h1 className={styles.h1}>
                rock paper scissors <br /> ai vs you
            </h1>
            <p className={styles.p}>
                round <span>{rounds[0]}</span> / left <span>{rounds[1]}</span>
            </p>
            <div className={styles.container}>
                <div className={styles.div1}>
                    <h3 className={styles.h}>
                        AI: <span>{winner[0]}</span>
                    </h3>
                    <div className={styles.div1_imgDiv}>
                        {aiSelected === "r_p_s" && (
                            <Image
                                src={r_p_s}
                                sizes="(min-width: 768px) 400px, 200px"
                                layout="responsive"
                                objectFit="cover"
                                priority={false}
                                loading="lazy"
                                alt="r_p_s"
                            />
                        )}
                        {aiSelected === "rock" && (
                            <Image
                                src={rock}
                                sizes="(min-width: 768px) 400px, 200px"
                                layout="responsive"
                                objectFit="cover"
                                priority={false}
                                loading="lazy"
                                alt="ROCK"
                            />
                        )}
                        {aiSelected === "paper" && (
                            <Image
                                src={paper}
                                sizes="(min-width: 768px) 400px, 200px"
                                layout="responsive"
                                objectFit="cover"
                                priority={false}
                                loading="lazy"
                                alt="PAPER"
                            />
                        )}
                        {aiSelected === "scissors" && (
                            <Image
                                src={scissors}
                                sizes="(min-width: 768px) 400px, 200px"
                                layout="responsive"
                                objectFit="cover"
                                priority={false}
                                loading="lazy"
                                alt="SCISSORS"
                            />
                        )}
                    </div>
                </div>
                <div className={styles.div2}>
                    <h3 className={styles.h}>
                        YOU: <span>{winner[1]}</span>
                    </h3>
                    <div className={styles.div2_imgDiv}>
                        {humanSelected === "r_p_s" && (
                            <Image
                                src={r_p_s}
                                sizes="(min-width: 768px) 400px, 200px"
                                layout="responsive"
                                objectFit="cover"
                                priority={false}
                                loading="lazy"
                                alt="r_p_s"
                            />
                        )}
                        {humanSelected === "rock" && (
                            <Image
                                src={rock}
                                sizes="(min-width: 768px) 400px, 200px"
                                layout="responsive"
                                objectFit="cover"
                                priority={false}
                                loading="lazy"
                                alt="ROCK"
                            />
                        )}
                        {humanSelected === "paper" && (
                            <Image
                                src={paper}
                                sizes="(min-width: 768px) 400px, 200px"
                                layout="responsive"
                                objectFit="cover"
                                priority={false}
                                loading="lazy"
                                alt="PAPER"
                            />
                        )}
                        {humanSelected === "scissors" && (
                            <Image
                                src={scissors}
                                sizes="(min-width: 768px) 400px, 200px"
                                layout="responsive"
                                objectFit="cover"
                                priority={false}
                                loading="lazy"
                                alt="SCISSORS"
                            />
                        )}
                        {humanSelected === "cam" && (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={styles.videoElement}
                            />
                        )}
                        {/* {humanSelected === "captured" && capturedImage && (
                            <Image
                                src={capturedImage}
                                alt="Captured"
                                width={400}
                                height={400}
                                style={{
                                    width: "100%",
                                    height: "auto",
                                    maxHeight: "400px",
                                    objectFit: "cover",
                                }}
                            />
                        )} */}
                    </div>
                </div>
            </div>
            {counting !== null ? <p className={styles.counting}>footage will be captured in: <span>{counting}</span></p> : null}
            <button onClick={handleCamera} disabled={gameOver} className={styles.begin}>start the round</button>
            <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
        </div>
    );
};

export default GameTime;
