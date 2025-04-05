import { UserModel } from "./domain"

export const defaultUser: UserModel = {
    userId: 0,
    username: "Guest",
    avatarUrl: null,
    steamLink: null,
    tgId: null,
    email: null,
    firstName: null,
    lastName: null,
    isBanned: false,
}
