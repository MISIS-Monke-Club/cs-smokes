import { Link } from "react-router-dom"
import classes from "./footer.module.scss"
import { Button } from "@shared/ui/button"
import { Icons } from "@shared/ui/icons"

const config: { path: string; icon: React.ReactNode; activeOn: string[] }[] = [
    {
        path: "/favorites",
        icon: <Icons.LikeIcon />,
        activeOn: ["favorites"],
    },
    {
        path: "/maps",
        icon: <Icons.ListIcon />,
        activeOn: ["maps", "grenade"],
    },
    {
        path: "/grenade",
        icon: <Icons.GrenadeIcon />,
        activeOn: ["maps", "grenade"],
    },
    {
        path: "/profile",
        icon: <Icons.UserIcon />,
        activeOn: ["profile", "pull-request"],
    },
]

export function Footer() {
    return (
        <footer className={classes.footer}>
            <nav className={classes.links}>
                {config.map((el) => {
                    // let status: "active" | "inactive" = "inactive"

                    return (
                        <Button
                            key={crypto.randomUUID()}
                            variant='ghost'
                            asChild
                        >
                            <Link to={el.path}>{el.icon}</Link>
                        </Button>
                    )
                })}
            </nav>
        </footer>
    )
}
