import { Outlet } from "react-router-dom"
import classes from "./layout.module.scss"
import { Footer } from "./footer/footer"

export function Layout() {
    return (
        <div className={classes.appContainer}>
            <div className='w-[100dvw] h-[100dvh] fixed -z-50 bg-background text-foreground' />
            <div className={classes.page}>
                <div className={classes.content}>
                    <Outlet />
                </div>
                <Footer />
            </div>
        </div>
    )
}
