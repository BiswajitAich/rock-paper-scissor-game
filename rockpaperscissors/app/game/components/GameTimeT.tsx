"use client";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import rock from "@/public/images/rock.png";
import paper from "@/public/images/paper.png";
import scissors from "@/public/images/scissors.png";
import r_p_s from "@/public/images/rock-paper-scissors-gif.gif";
import styles from "@/app/game/components/componentStyles/gameTime.module.css";
import GameLogic from "@/app/game/logic/gamelogic";
import * as tf from '@tensorflow/tfjs';

const HealthStatus = dynamic(() => import("@/app/game/components/HealthStatus"), { ssr: false })

interface GameScore {
    human: number;
    ai: number;
    winner: string;
}

interface Detection {
    box: number[];
    class: number;
    score: number;
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
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [counting, setCounting] = useState<number | null>(null);
    const displayCanvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraStarted, setCameraStarted] = useState(false);
    const [modelResponseFlag, setModelResponseFlag] = useState<string>("none");
    const [winner, setWinner] = useState<string[]>([]);
    const [message, setMessage] = useState<string>("");
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [model, setModel] = useState<tf.GraphModel | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const gameRef = useRef<GameLogic>(new GameLogic(selectedRound));
    const animationFrameId = useRef<number | null>(null);
    const predictionInProgress = useRef<boolean>(false);

    useEffect(() => {
        // Reset the game if a new round is selected
        gameRef.current = new GameLogic(selectedRound);
        setRounds([selectedRound, selectedRound]);
    }, [selectedRound]);

    useEffect(() => {
        const setModelLoading = async () => {
            setIsLoading(() => true);
            setMessage(() => "Loading the model");
            try {
                await tf.setBackend('webgl');
                await tf.ready();
                const model = await tf.loadGraphModel('/model/r-p-s/model.json');
                setModel(model);

                // Warm up the model
                const dummyInput = tf.zeros([1, 640, 640, 3], 'float32');
                const warmupResult = model.execute(dummyInput);
                tf.dispose(warmupResult);
                dummyInput.dispose();
            } catch (error) {
                console.error(error);
                setMessage("Error in loading the model! \nTry reloading the page..\n")
            } finally {
                setIsLoading(() => false);
                setMessage("")
            }
        }
        setModelLoading()

        // Clean up animation frame on unmount
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        }
    }, [])

    const predict = async (imageTensor: tf.Tensor) => {
        try {
            if (!model) {
                console.error("Model not loaded");
                return null;
            }

            const predictions = model.execute(imageTensor) as tf.Tensor;
            const numDetections = 8400;
            const data = predictions.dataSync();

            const detections = [];
            for (let i = 0; i < numDetections; i++) {
                // Each channel has 8400 values. Use offsets accordingly.
                const cx = data[i];                           // x center
                const cy = data[i + numDetections];           // y center
                const w = data[i + numDetections * 2];        // width
                const h = data[i + numDetections * 3];        // height

                const scorePaper = data[i + numDetections * 4];
                const scoreRock = data[i + numDetections * 5];
                const scoreScissors = data[i + numDetections * 6];

                const scores = [scorePaper, scoreRock, scoreScissors];
                const maxScore = Math.max(...scores);
                const classId = scores.indexOf(maxScore);
                // 0: Paper, 1: Rock, 2: Scissors

                const xMin = cx - w / 2;
                const yMin = cy - h / 2;
                const xMax = cx + w / 2;
                const yMax = cy + h / 2;

                if (maxScore > 0.5) {
                    detections.push({
                        box: [xMin, yMin, xMax, yMax],
                        class: classId,
                        score: maxScore
                    });
                }
            }

            // Clean up
            tf.dispose(predictions);
            tf.dispose(imageTensor);

            if (detections.length > 0) {
                const bestDetection = detections.reduce((max, det) =>
                    det.score > max.score ? det : max, detections[0]);
                return bestDetection;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error in prediction:", error);
            return null;
        }
    };

    const drawBoundingBox = (detection: Detection) => {
        if (!displayCanvasRef.current) return;

        const canvas = displayCanvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        // Clear previous drawings
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Get box coordinates
        const xMin = detection.box[0];
        const yMin = detection.box[1];
        const xMax = detection.box[2];
        const yMax = detection.box[3];

        const width = xMax - xMin;
        const height = yMax - yMin;

        // Create class label
        const classes = ["Paper", "Rock", "Scissors"];
        const label = classes[detection.class];

        // Set styles for bounding box
        context.lineWidth = 4;
        context.strokeStyle = detection.class === 0 ? "#00BFFF" :
            detection.class === 1 ? "#FF4500" : "#32CD32"; // Different colors for each class

        // Draw the bounding box without mirroring
        context.beginPath();
        context.rect(xMin, yMin, width, height);
        context.stroke();

        // Add text label (also without mirroring)
        context.fillStyle = context.strokeStyle;
        context.font = "20px Arial";
        context.save();
        context.scale(-1, 1);
        context.fillText(`${label}: ${(detection.score * 100).toFixed(1)}%`, -(xMin + xMax) / 2, yMin - 5);
    };

    const processVideoFrame = async () => {
        if (!videoRef.current || !displayCanvasRef.current || !canvasRef.current || predictionInProgress.current) {
            animationFrameId.current = requestAnimationFrame(processVideoFrame);
            return;
        }

        // Set flag to prevent concurrent predictions
        predictionInProgress.current = true;

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const displayCanvas = displayCanvasRef.current;

            // Ensure canvas is properly sized
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                displayCanvas.width = video.videoWidth;
                displayCanvas.height = video.videoHeight;
            }

            // Draw current video frame to hidden canvas
            const context = canvas.getContext("2d");
            if (context) {
                // Important: we're drawing the unmirrored video to our processing canvas
                // The video element itself is mirrored with CSS for display only
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Get image data and convert to tensor
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const tensor = tf.browser.fromPixels(imageData)
                    .toFloat()
                    .div(255) // Normalize to [0,1]
                    .expandDims(0); // Reshape to [1, 640, 640, 3]

                // Run prediction
                const bestDetection = await predict(tensor);

                // If we have a valid detection, draw the bounding box
                if (bestDetection) {
                    drawBoundingBox(bestDetection);
                } else {
                    // Clear the canvas if no detection
                    const displayContext = displayCanvas.getContext("2d");
                    if (displayContext) {
                        displayContext.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
                    }
                }
            }
        } catch (error) {
            console.error("Error processing video frame:", error);
        } finally {
            predictionInProgress.current = false;
            animationFrameId.current = requestAnimationFrame(processVideoFrame);
        }
    };

    const handleCamera = async () => {
        if (cameraStarted) return;
        setCameraStarted(true);

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
                await videoRef.current.play().catch((error) => {
                    console.error("Error playing video:", error);
                });

                // Initialize canvases
                if (canvasRef.current && displayCanvasRef.current) {
                    canvasRef.current.width = 640;
                    canvasRef.current.height = 640;
                    displayCanvasRef.current.width = 640;
                    displayCanvasRef.current.height = 640;
                }

                // Start processing frames
                animationFrameId.current = requestAnimationFrame(processVideoFrame);
            } else {
                handleCamera();
            }

            setHumanSelected("cam");
        } catch (err) {
            console.error("Error accessing camera:", err);
            setHumanSelected("r_p_s");
            setMessage("Could not access camera. Please check permissions.");
            setCameraStarted(false);
        }
    };

    const captureImage = async () => {
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
                // Draw the unmirrored video frame to our processing canvas
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Save captured image
                setCapturedImage(canvas.toDataURL('image/jpeg'));

                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const tensor = tf.browser.fromPixels(imageData)
                    .toFloat()
                    .div(255) // Normalize to [0,1]
                    .expandDims(0); // Reshape to [1, 640, 640, 3]

                const bestDetection = await predict(tensor);
                if (!bestDetection) {
                    setMessage("Didn't get the prediction!\n try again.");
                    setAiSelected("r_p_s");
                    setHumanSelected("r_p_s");
                    setTimeout(() => { setMessage(""); }, 2000);
                    return;
                }

                // Update selections based on the detected hand gesture
                setHumanSelected(["paper", "rock", "scissors"][bestDetection.class]);
                setAiSelected(generateChoice());
                setModelResponseFlag("received");
            }
        }
    };

    const stopVideoFeed = () => {
        // Stop animation frame
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }

        // Stop media stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraStarted(false);
        setHumanSelected("captured");
        setGameOver(false);
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
                        clearInterval(interval!); 
                        return prev; 
                    }
                    return prev - 1; 
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

    useEffect(() => {
        if (modelResponseFlag === "received") handelGame();
    }, [modelResponseFlag]);

    const handelGame = () => {
        const res = gameRef.current.playRound(aiSelected, humanSelected);
        if (res === "win") setWinner(["lose", res]);
        else if (res === "lose") setWinner(["win", res]);
        else setWinner([res, res]);

        setRounds(prev => [prev[0], gameRef.current.getRemainingRounds()]);
        if (gameRef.current.getRemainingRounds() === 0) {
            setTimeout(() => sendgameScores(gameRef.current.getScores()), 3000);
            setGameOver(true);
        }

        // Reset model response flag after handling game
        setModelResponseFlag("none");
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
                                height={200}
                                width={200}
                                loading="lazy"
                                alt="r_p_s"
                            />
                        )}
                        {aiSelected === "rock" && (
                            <Image
                                src={rock}
                                height={200}
                                width={200}
                                loading="lazy"
                                alt="ROCK"
                            />
                        )}
                        {aiSelected === "paper" && (
                            <Image
                                src={paper}
                                height={200}
                                width={200}
                                loading="lazy"
                                alt="PAPER"
                            />
                        )}
                        {aiSelected === "scissors" && (
                            <Image
                                src={scissors}
                                height={200}
                                width={200}
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
                    <div className={styles.div2_imgDiv} style={{ position: 'relative' }}>
                        {humanSelected === "r_p_s" && (
                            <Image
                                src={r_p_s}
                                height={200}
                                width={200}
                                loading="lazy"
                                alt="r_p_s"
                            />
                        )}
                        {humanSelected === "rock" && (
                            <Image
                                src={rock}
                                height={200}
                                width={200}
                                loading="lazy"
                                alt="ROCK"
                            />
                        )}
                        {humanSelected === "paper" && (
                            <Image
                                src={paper}
                                height={200}
                                width={200}
                                loading="lazy"
                                alt="PAPER"
                            />
                        )}
                        {humanSelected === "scissors" && (
                            <Image
                                src={scissors}
                                height={200}
                                width={200}
                                loading="lazy"
                                alt="SCISSORS"
                            />
                        )}
                        {humanSelected === "cam" && (
                            <>
                                <video
                                    style={{
                                        transform: 'scaleX(-1)',
                                        WebkitTransform: 'scaleX(-1)'
                                    }}
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={styles.videoElement}
                                />
                                <canvas
                                    ref={displayCanvasRef}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        transform: 'scaleX(-1)',
                                        WebkitTransform: 'scaleX(-1)',
                                        pointerEvents: 'none'
                                    }}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
            {isLoading || message !== "" ? <HealthStatus data={message} /> : null}
            {counting !== null ? <p className={styles.counting}>footage will be captured in: <span>{counting}</span></p> : null}
            <button onClick={handleCamera} disabled={gameOver || isLoading || cameraStarted} className={styles.begin}>start the round</button>
            <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
        </div>
    );
};

export default GameTime;