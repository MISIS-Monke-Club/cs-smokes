import { Link } from "react-router-dom"
import { useSelector } from "react-redux"
import classes from "./own-profile-page.module.scss"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@shared/ui/tabs"
import { UserProfile } from "@entities/user"
import { selectUserId } from "@entities/session"
import { useGetOwnProfile } from "@features/profile/get-own"
import { Button } from "@shared/ui/button"
import { MyGrenadesList } from "@widgets/my-lineups"

export function OwnProfilePage() {
    const userId = useSelector(selectUserId)
    const { profile, isLoading } = useGetOwnProfile()

    if (!profile || isLoading) {
        return <div>Loading your profile...</div>
    }

    const isEditable = profile.userId === userId

    return (
        <div className={classes.container}>
            <Tabs defaultValue='profile' style={{ width: "100%" }}>
                <TabsList style={{ width: "100%" }}>
                    <TabsTrigger
                        value='profile'
                        style={{
                            flexGrow: 1,
                            flexShrink: 1,
                            flexBasis: "0%",
                        }}
                    >
                        Profile
                    </TabsTrigger>
                    <TabsTrigger
                        value='lineups'
                        style={{
                            flexGrow: 1,
                            flexShrink: 1,
                            flexBasis: "0%",
                        }}
                    >
                        My Lineups
                    </TabsTrigger>
                </TabsList>

                <TabsContent value='profile'>
                    <div style={{ padding: "0px" }}>
                        <h1 className={classes.title}>@{profile.username}</h1>
                        <div className={classes.profile}>
                            <UserProfile user={profile} isLoading={isLoading} />
                        </div>
                        {isEditable && (
                            <Button
                                size='lg'
                                asChild
                                className={classes.editButton}
                            >
                                <Link to='/profile/edit'>Edit</Link>
                            </Button>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value='lineups'>
                    <div style={{ padding: "0px" }}>
                        <MyGrenadesList />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
