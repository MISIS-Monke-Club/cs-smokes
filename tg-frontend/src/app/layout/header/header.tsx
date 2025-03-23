import { Link } from "react-router-dom"
import classes from "./header.module.scss"
import { Button } from "@shared/ui/button"

export function Header() {
    return (
        <header className={classes.header}>
            <img
                className={classes.logo}
                src='/'
                alt='logo'
                width='300'
                height='150'
                loading='lazy'
            />
            <nav>
                <Button asChild variant='link'>
                    <Link to='/'>Home</Link>
                </Button>
                <Button asChild variant='link'>
                    <Link to='/maps'>Maps</Link>
                </Button>
                <Button asChild variant='link'>
                    <Link to='/grenades'>All grenades</Link>
                </Button>
            </nav>
            <div className={classes.actions}>
                <Button>Sign up</Button>
                <Button variant='secondary' asChild>
                    <Link to='/login'>Login</Link>
                </Button>
            </div>
        </header>
    )
}
