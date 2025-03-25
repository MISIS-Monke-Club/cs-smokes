import { useState, useEffect } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import classes from "./edit-profile-page.module.scss"
import { RootState } from "@shared/store"
import { userApi } from "@entities/user"
import { Button } from "@shared/ui/button/button"

export function EditProfilePage() {
    const userId = useSelector((state: RootState) => state.user.userId)
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const { data: user, isLoading } = useQuery(userApi.getUserById(userId))

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        steam_link: "",
    })

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || "",
                steam_link: user.steam_link || "",
                email: user.email || "",
                first_name: user.first_name || "",
                last_name: user.last_name || "",
            })
        }
    }, [user])

    const updateUserMutation = useMutation({
        mutationKey: [userApi.baseKey, "update"],
        mutationFn: async () => {
            if (!user) throw new Error("User is not loaded")
            return userApi.updateUser({ userId: user.user_id, ...formData })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [userApi.baseKey, "profile"],
            })
            navigate("/profile")
        },
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateUserMutation.mutate()
    }

    const [isEditing, setIsEditing] = useState(false)

    const handleEditClick = () => {
        setIsEditing(true)
    }

    if (isLoading) <b>Loading...</b>

    return (
        <>
            <div>
                <h1 className={classes.title}>Редактирование профиля</h1>
                <form onSubmit={handleSubmit} className={classes.form}>
                    <input
                        disabled={!isEditing}
                        className={classes.input}
                        type='text'
                        name='username'
                        value={formData.username}
                        onChange={handleChange}
                        placeholder='Username'
                    />
                    <input
                        disabled={!isEditing}
                        className={classes.input}
                        type='text'
                        name='steam_link'
                        value={formData.steam_link}
                        onChange={handleChange}
                        placeholder='Steam Link'
                    />
                    <input
                        disabled={!isEditing}
                        className={classes.input}
                        type='email'
                        name='email'
                        value={formData.email}
                        onChange={handleChange}
                        placeholder='Email'
                    />
                    <input
                        disabled={!isEditing}
                        className={classes.input}
                        type='text'
                        name='first_name'
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder='First Name'
                    />
                    <input
                        disabled={!isEditing}
                        className={classes.input}
                        type='text'
                        name='last_name'
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder='Last Name'
                    />
                    <div className={classes.buttons}>
                        {!isEditing ? (
                            <Button
                                size='lg'
                                onClick={handleEditClick}
                                disabled={isEditing}
                            >
                                Начать редактировать
                            </Button>
                        ) : (
                            <Button size='lg'>
                                <Link to='/profile'>Отмена</Link>
                            </Button>
                        )}
                        <Button size='lg' type='submit' disabled={!isEditing}>
                            Сохранить
                        </Button>
                    </div>
                </form>
            </div>
        </>
    )
}
