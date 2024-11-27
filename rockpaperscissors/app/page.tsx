import Image from "next/image";
import styles from "./page.module.css";
import gif from "@/public/images/rock-paper-scissors-gif.gif"
import arrow from "@/public/images/arrow.png"
import controller from "@/public/images/game-controller.png"
import Link from "next/link";
export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.main_div}>
          <h1>rock paper scissors</h1>
          <div className={styles.gif_div}>
            <Image src={gif}
              sizes="(min-width: 768px) 400px, 200px"
              layout="responsive"
              objectFit="cover"
              priority={false}
              loading="lazy"
              alt="ROCK PAPER SCISSORS"
            />
          </div>
          <Link href={'/game/RockPaperScissors'}>
            <p>play now</p>
            <Image src={arrow}
              height={50}
              width={50}
              alt="go"
            />
          </Link>
        </div>
        <Image
          src={controller}
          height={500}
          width={500}
          alt=""
          className={styles.controller}
        />
      </main>
    </div>
  );
}
