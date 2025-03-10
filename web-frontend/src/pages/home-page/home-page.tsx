import { Button } from "@shared/ui/button"
import classes from "./home-page.module.scss"
import { Link } from "react-router-dom"

export function Homepage() {
    return (
        <>
            <section className={classes.landingSection}>
                <div className={classes.main}>
                    <div className={classes.header}>
                        <h1 className={classes.title}>
                            Добро пожаловать на сайт с раскидками!
                        </h1>
                        <h2 className={classes.subTitle}>
                            Новое слово в современном гейминге
                        </h2>
                    </div>
                    <img
                        className={classes.previewImage}
                        src='/preview-image.jpg'
                        alt='preview image'
                        width='300'
                        height='300'
                        loading='lazy'
                    />
                </div>
                <Button size='lg' asChild>
                    <Link to='/grenades'>Найти раскидку для себя</Link>
                </Button>
            </section>
        </>
    )
}
