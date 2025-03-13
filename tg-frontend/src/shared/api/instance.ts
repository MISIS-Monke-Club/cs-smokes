import { BASE_BACKEND_URL } from "../config/constants"
import axios from "axios"

export const instance = axios.create({
    baseURL: BASE_BACKEND_URL,
})
