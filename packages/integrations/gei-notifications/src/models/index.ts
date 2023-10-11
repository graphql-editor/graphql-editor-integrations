import { QueryModel } from './QueryModel.js'
import { UserQueryModel } from './UserQueryModel.js'
import { MutationModel } from './MutationModel.js'
import { UserMutationModel } from './UserMutationModel.js'
import { GetPushNotificationTokenResultModel } from './GetPushNotificationTokenResultModel.js'
import { GetChannelAuthorizationResultModel } from './GetChannelAuthorizationResultModel.js'
import { SendNotificationResultModel } from './SendNotificationResultModel.js'
import { GlobalErrorModel } from './GlobalErrorModel.js'


export type Models = {
	QueryModel: QueryModel;
	UserQueryModel: UserQueryModel;
	MutationModel: MutationModel;
	UserMutationModel: UserMutationModel;
	GetPushNotificationTokenResultModel: GetPushNotificationTokenResultModel;
	GetChannelAuthorizationResultModel: GetChannelAuthorizationResultModel;
	SendNotificationResultModel: SendNotificationResultModel;
	GlobalErrorModel: GlobalErrorModel;
};