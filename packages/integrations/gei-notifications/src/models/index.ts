import { QueryModel } from './QueryModel.js'
import { UserQueryModel } from './UserQueryModel.js'
import { MutationModel } from './MutationModel.js'
import { UserMutationModel } from './UserMutationModel.js'
import { GeneratePushNotificationTokenResultModel } from './GeneratePushNotificationTokenResultModel.js'
import { GetChannelAuthorizationResultModel } from './GetChannelAuthorizationResultModel.js'
import { SendNotificationResultModel } from './SendNotificationResultModel.js'
import { GlobalErrorModel } from './GlobalErrorModel.js'


export type Models = {
	QueryModel: QueryModel;
	UserQueryModel: UserQueryModel;
	MutationModel: MutationModel;
	UserMutationModel: UserMutationModel;
	GeneratePushNotificationTokenResultModel: GeneratePushNotificationTokenResultModel;
	GetChannelAuthorizationResultModel: GetChannelAuthorizationResultModel;
	SendNotificationResultModel: SendNotificationResultModel;
	GlobalErrorModel: GlobalErrorModel;
};