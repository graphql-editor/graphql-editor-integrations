/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	Object:{
		oneToOne:{
			data:"DataInput"
		},
		oneToMany:{
			data:"DataInput"
		}
	},
	Query:{
		objects:{
			data:"DataInput",
			fieldFilter:"FieldFilterInput",
			fieldRegexFilter:"FieldFilterInput",
			dateFilter:"DateFilterInput",
			sortByField:"SortInput"
		},
		paginatedObjects:{
			data:"DataInput",
			fieldFilter:"FieldFilterInput",
			fieldRegexFilter:"FieldFilterInput",
			dateFilter:"DateFilterInput",
			sortByField:"SortInput",
			paginate:"PageOptions"
		},
		oneById:{
			data:"DataInput"
		},
		fieldValueIsUnique:{

		}
	},
	Mutation:{
		create:{
			object:"CreateInput"
		},
		update:{
			object:"Update"
		},
		createObjects:{
			objects:"CreateInput"
		},
		updateObjects:{
			objects:"UpdateInput"
		},
		delete:{
			data:"DataInput"
		}
	},
	DataInput:{
		related:"ReladedInput",
		addFields:"AddFieldsInput"
	},
	AddFieldsInput:{

	},
	ReladedInput:{

	},
	FieldFilterInput:{

	},
	SortInput:{
		field:"SortField"
	},
	DateFilterInput:{

	},
	SortField: "enum" as const,
	Update:{

	},
	UpdateInput:{

	},
	CreateInput:{

	},
	PageOptions:{

	}
}

export const ReturnTypes: Record<string,any> = {
	Object:{
		name:"String",
		content:"String",
		oneToOne:"Object",
		oneToMany:"Object",
		_id:"String",
		createdAt:"String",
		updatedAt:"String"
	},
	Query:{
		objects:"Object",
		paginatedObjects:"PaginatedObjects",
		oneById:"Object",
		fieldValueIsUnique:"Boolean"
	},
	Mutation:{
		create:"String",
		update:"Boolean",
		createObjects:"String",
		updateObjects:"Boolean",
		delete:"Boolean"
	},
	PaginatedObjects:{
		cursorId:"String",
		objects:"Object"
	}
}

export const Ops = {
query: "Query" as const,
	mutation: "Mutation" as const
}