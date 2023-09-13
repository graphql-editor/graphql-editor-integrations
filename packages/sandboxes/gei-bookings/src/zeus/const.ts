/* eslint-disable */

export const AllTypesProps: Record<string,any> = {

}

export const ReturnTypes: Record<string,any> = {
	UserQuery:{
		randomQuery:"String"
	},
	PublicQuery:{
		randomQuery:"String"
	},
	UserMutation:{
		randomMutation:"String"
	},
	Mutation:{
		user:"UserMutation"
	},
	Query:{
		user:"UserQuery",
		public:"PublicQuery"
	}
}

export const Ops = {
query: "Query" as const,
	mutation: "Mutation" as const
}