import Image from "next/image";
import waitin from "@/public/images/waitin.gif";
import styles from "@/app/game/components/componentStyles/healthStatus.module.css";
const HealthStatus = ({ data }: { data: string }) => {
    return (
        <div className={styles.container}>
            <span className={styles.span}>
                {data}
            </span>
            <div className={styles.img_Div}>
                <Image src={waitin}
                    height={400}
                    width={400}
                    alt="SORRY PLEASE WAIT"
                />
            </div>
        </div>
    );
}

export default HealthStatus;