export { api as sessionApi } from "./api"
export type { LoginTgPostModel } from "./api"
export type { LoginTgModel } from "./model/domain"
export { loginTgErrorDTO } from "./model/domain"
export {
    slice as userSlice,
    selectUserId,
    setUserId,
    selectError,
    deleteUser,
    setUserError,
} from "./model/slice"
