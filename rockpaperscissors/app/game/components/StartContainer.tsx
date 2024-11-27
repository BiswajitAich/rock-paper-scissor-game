import Image from "next/image";
import styles from "@/app/game/components/componentStyles/startContainer.module.css"
import RockPaperScissorCartoon from "@/public/images/rock-paper-scissors-cartoon.png"
import robot from "@/public/images/robot.gif"
import human from "@/public/images/human.png"
const StartContainer = ({ sendFlag }: { sendFlag: () => void }) => {

    return (
        <>
            <Image
                src={robot}
                sizes="(min-width: 768px) 400px, 100px"
                alt="robot"
                layout="responsive"
                objectFit="cover"
                priority={false}
                loading="lazy"
                className={styles.robot}
            />
            <div className={styles.cartoon_div}>
                <Image src={RockPaperScissorCartoon}
                    sizes="(min-width: 768px) 400px, 200px"
                    layout="responsive"
                    objectFit="cover"
                    priority={false}
                    loading="lazy"
                    alt="ROCK PAPER SCISSORS"
                />
            </div>
            <button className={styles.start_container_btn}
                onClick={sendFlag}
            >
                <p>start</p>
            </button>
            <Image
                src={human}
                sizes="(min-width: 768px) 400px, 100px"
                alt="human"
                layout="responsive"
                objectFit="cover"
                priority={false}
                loading="lazy"
                className={styles.human}
            />
        </>
    );
}

export default StartContainer;