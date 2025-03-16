import { Outlet } from "react-router-dom"
import { Main } from "./main"
import classes from "./layout.module.scss"
import { Header } from "./header"

export function Layout() {
    return (
        <div className={classes.appContainer}>
            <div className='w-[100dvw] h-[100dvh] fixed -z-50 bg-background text-foreground' />
            <div className={classes.page}>
                <Header />
                <Main>
                    <Outlet />
                </Main>
            </div>
        </div>
    )
}
