/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	Query:{
		getFile:{

		}
	},
	Mutation:{
		uploadFile:{
			fileInput:"FileInput"
		}
	},
	FileInput:{

	}
}

export const ReturnTypes: Record<string,any> = {
	Query:{
		getFile:"String"
	},
	Mutation:{
		uploadFile:"FileUploadResponse"
	},
	FileUploadResponse:{
		putUrl:"String",
		fileKey:"String"
	}
}

export const Ops = {
query: "Query" as const,
	mutation: "Mutation" as const
}