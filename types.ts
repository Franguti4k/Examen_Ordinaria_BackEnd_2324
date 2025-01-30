import {OptionalId} from "mongodb"

export type ContactModel = OptionalId <{
    name: string,
    phone: string,
    country: string,
    timezone: string
}>

export type APIPhone = {
    is_valid:boolean,
    country:string,
    timezones: string[]
}

export type APITime = {
    datetime:string
}
