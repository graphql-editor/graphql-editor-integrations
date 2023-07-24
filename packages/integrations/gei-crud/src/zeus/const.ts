/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	Query:{
		oneById:{

		}
	},
	Mutation:{
		create:{
			object:"Update"
		},
		update:{
			object:"Update"
		},
		delete:{

		}
	},
	Create:{

	},
	Update:{

	}
}

export const ReturnTypes: Record<string,any> = {
	Object:{
		name:"String",
		content:"String",
		oneToOne:"Object",
		oneToMany:"Object",
		_id:"String"
	},
	Query:{
		objects:"Object",
		oneById:"Object"
	},
	Mutation:{
		create:"String",
		update:"Boolean",
		delete:"Boolean"
	}
}

export const Ops = {
query: "Query" as const,
	mutation: "Mutation" as const
}