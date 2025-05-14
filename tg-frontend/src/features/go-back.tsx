import { useNavigate } from "react-router-dom"
import { Button } from "@shared/ui/button"
import { Icons } from "@shared/ui/icons"

type GoBackProps = React.ComponentProps<"button"> & {}

export function GoBack({ ...rest }: GoBackProps) {
    const navigate = useNavigate()

    function clickHandler() {
        navigate(-1)
    }

    return (
        <Button variant='default' size='icon' onClick={clickHandler} {...rest}>
            <Icons.LeftArrowIcon />
        </Button>
    )
}
