import Image from "next/image";
import r_vs_h from "@/public/images/robot_vs_human.webp"
import styles from "@/app/game/components/componentStyles/vs.module.css"
import { useEffect, useState } from "react";
const Vs = () => {
    const [display, setDisplay] = useState<string>("")
    const sentence = "leets begin the game !"
    var chars = sentence.split("");
    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            if (index < chars.length - 1) {
                setDisplay((prev: string) => prev + chars[index])
                index++;
            } else {
                clearInterval(interval)
            }

        }, 100)
        return () => clearInterval(interval);
    }, [])
    return (
        <div className={styles.container}>
            <h2 className={styles.h2}>ai vs you</h2>
            <p className={styles.p}><span>{display}</span></p>
            <div className={styles.vs_img_div}>
                <Image
                    src={r_vs_h}
                    sizes="(min-width: 768px) 400px, 200px"
                    layout="responsive"
                    objectFit="cover"
                    priority={false}
                    loading="lazy"
                    alt="Ai vs You"
                />
            </div>
        </div>
    );
}

export default Vs;