import axios from "axios"
import { BASE_BACKEND_URL } from "../config/constants"

export const instance = axios.create({
    baseURL: BASE_BACKEND_URL,
})
