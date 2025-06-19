import { useNavigate } from "react-router-dom"
import clsx from "clsx"
import classes from "./go-back.module.scss"
import { Button } from "@shared/ui/button"
import { Icons } from "@shared/ui/icons"

type GoBackProps = React.ComponentProps<"button"> & {}

export function GoBack({ className = "", ...rest }: GoBackProps) {
    const navigate = useNavigate()

    function clickHandler() {
        navigate(-1)
    }

    return (
        <Button
            className={clsx(classes.backButton, className)}
            size='icon'
            onClick={clickHandler}
            {...rest}
        >
            <Icons.LeftArrowIcon />
        </Button>
    )
}
