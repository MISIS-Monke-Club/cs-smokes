import classes from "./home-page.module.scss"

export function Homepage() {
    return (
        <>
            <section className={classes.landingSection}>
                <div className={classes.main}>
                    <div className={classes.header}>
                        <h1 className={classes.title}>
                            Добро пожаловать на сайт с раскидками!
                        </h1>
                    </div>
                </div>
            </section>
        </>
    )
}
