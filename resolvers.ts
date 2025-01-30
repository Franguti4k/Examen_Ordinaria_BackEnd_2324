import { Collection, ObjectId } from "mongodb"
import { GraphQLError } from "graphql";
import { APITime, ContactModel } from "./types.ts";
import { APIPhone } from "./types.ts";


type Context = {contactCollection: Collection<ContactModel>}
type getContactQueryArgs = {id:string}
type deleteContactMutationArgs = {id:string}
type addContactMutationArgs = {
    name:string,
    phone: string
}
type updateContactMutationArgs ={
    id: string,
    name: string,
    phone: string
}
export const resolvers = {
    Query:{
        getContacts: async(_:unknown, __:unknown, ctx: Context):Promise<ContactModel[]> => await ctx.contactCollection.find().toArray(),
        getContact: async(_:unknown, args: getContactQueryArgs, ctx:Context):Promise<ContactModel | null> => {
            return await ctx.contactCollection.findOne({_id:new ObjectId(args.id)})
        }
    },

    Mutation:{
        deleteContact: async(_:unknown, args: deleteContactMutationArgs, ctx: Context):Promise<boolean> => {
            const {deletedCount} = await ctx.contactCollection.deleteOne({_id: new ObjectId(args.id)})
            return deletedCount === 1
        },

        addContact: async(_:unknown, args: addContactMutationArgs, ctx: Context):Promise<ContactModel> => {
            const API_KEY = Deno.env.get("API_KEY")
            if(!API_KEY) throw new GraphQLError("API KEY Not Provided")
                const { phone, name } = args;
            const phoneExist = await ctx.contactCollection.countDocuments({ phone });
            if (phoneExist >= 1) throw new GraphQLError("Phone exists");
      
            const url = `https://api.api-ninjas.com/v1/validatephone?number=${phone}`;
            const data = await fetch(url,{headers: {"X-Api-Key": API_KEY}});
            if(data.status !== 200) throw new GraphQLError("API Nija Error")
            const response:APIPhone = await data.json()
            const is_valid = response.is_valid
            if(!is_valid) throw new GraphQLError("phone not valid")
            const country = response.country
            const timezone = response.timezones[0]
            const {insertedId} = await ctx.contactCollection.insertOne({
                name,
                phone,
                country,
                timezone
            })
            return {
                _id: insertedId,
                name,
                phone,
                country,
                timezone
            }
        },

        updateContact: async(_:unknown, args: updateContactMutationArgs, ctx: Context):Promise<ContactModel > => {
            const {id, name, phone} = args
            const API_KEY = Deno.env.get("API_KEY")

            if(!phone){
                const newContact = await ctx.contactCollection.findOneAndUpdate({_id: new ObjectId(id)}, {$set:{name:name}})
                if(!newContact) throw new GraphQLError("Contact not found")
                return newContact
            }else if(!name){
                const contactExist = await ctx.contactCollection.countDocuments({phone:phone})
                if(contactExist >= 1) throw new GraphQLError("Phone already exist ")
                const url = `https://api.api-ninjas.com/v1/validatephone?number=${phone}`
                const data = await fetch(url, {headers:{"X-Api-Key":API_KEY}})
                if(data.status !== 200) throw new GraphQLError("API Nija Error")
                const response:APIPhone = await data.json()
                const is_valid = response.is_valid
                if(!is_valid) throw new GraphQLError("phone not valid")
                const country = response.country
                const timezone = response.timezones[0]
                const newContact = await ctx.contactCollection.findOneAndUpdate({_id: new ObjectId(id)},
                {$set:{phone:phone, country:country, timezone: timezone}})
                if(!newContact) throw new GraphQLError("Contact not found")
                return newContact
            }else{
                const contactExist = await ctx.contactCollection.countDocuments({phone:phone})
                if(contactExist >= 1) throw new GraphQLError("Phone already exist ")
                const url = `https://api.api-ninjas.com/v1/validatephone?number=${phone}`
                const data = await fetch(url, {headers:{"X-Api-Key":API_KEY}})
                if(data.status !== 200) throw new GraphQLError("API Nija Error")
                const response:APIPhone = await data.json()
                const is_valid = response.is_valid
                if(!is_valid) throw new GraphQLError("phone not valid")
                const country = response.country
                const timezone = response.timezones[0]
                const newContact = await ctx.contactCollection.findOneAndUpdate({_id: new ObjectId(id)},
                {$set:{name:name, phone:phone, country:country, timezone: timezone}})
                if(!newContact) throw new GraphQLError("Contact not found")
                return newContact
            }
        }

    },

    Contact: {
        id: (parent: ContactModel):string => parent._id!.toString(),
        time: async(parent: ContactModel): Promise<string> => {
            const API_KEY = Deno.env.get("API_KEY")
            if(!API_KEY) throw new GraphQLError("API KEY Not Provided")
            const timezone = parent.timezone
            const url = `https://api.api-ninjas.com/v1/worldtime?timezone=${timezone}`
            const data = await fetch(url, {headers:{"X-Api-Key": API_KEY}})
            if(data.status !== 200) throw new GraphQLError("API NInja Error")
            const response:APITime = await data.json()
            return response.datetime
        }
    }
}