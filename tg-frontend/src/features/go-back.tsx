import { Button } from "@shared/ui/button"
import { useNavigate } from "react-router-dom"

type GoBackProps = React.ComponentProps<"button"> & {}

export function GoBack({ ...rest }: GoBackProps) {
    const navigate = useNavigate()

    function clickHandler() {
        navigate(-1)
    }

    return (
        <Button variant='ghost' onClick={clickHandler} {...rest}>
            Назад
        </Button>
    )
}
