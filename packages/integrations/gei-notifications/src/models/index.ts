import { QueryModel } from './QueryModel.js'
import { UserQueryModel } from './UserQueryModel.js'
import { MutationModel } from './MutationModel.js'
import { UserMutationModel } from './UserMutationModel.js'
import { PublicQueryModel } from './PublicQueryModel.js'
import { NotificationGroupOpsModel } from './NotificationGroupOpsModel.js'
import { GeneratePushNotificationTokenResultModel } from './GeneratePushNotificationTokenResultModel.js'
import { ListChannelsResultModel } from './ListChannelsResultModel.js'
import { DeleteNotificationGroupResultModel } from './DeleteNotificationGroupResultModel.js'
import { SendStaticNotificationResultModel } from './SendStaticNotificationResultModel.js'
import { EditNotificationGroupResultModel } from './EditNotificationGroupResultModel.js'
import { AddUserToGroupResultModel } from './AddUserToGroupResultModel.js'
import { RemoveUserToGroupResultModel } from './RemoveUserToGroupResultModel.js'
import { CreateNotificationGroupResultModel } from './CreateNotificationGroupResultModel.js'
import { MarkNotificationReadedResultModel } from './MarkNotificationReadedResultModel.js'
import { ListNotificationGroupsResultModel } from './ListNotificationGroupsResultModel.js'
import { ListNotificationsResultModel } from './ListNotificationsResultModel.js'
import { GlobalErrorModel } from './GlobalErrorModel.js'
import { NotificationModel } from './NotificationModel.js'
import { NotificationGroupModel } from './NotificationGroupModel.js'
import { NotificationReadedModel } from './NotificationReadedModel.js'
import { ChannelModel } from './ChannelModel.js'
import { PageOptionsResultModel } from './PageOptionsResultModel.js'


export type Models = {
	QueryModel: QueryModel;
	UserQueryModel: UserQueryModel;
	MutationModel: MutationModel;
	UserMutationModel: UserMutationModel;
	PublicQueryModel: PublicQueryModel;
	NotificationGroupOpsModel: NotificationGroupOpsModel;
	GeneratePushNotificationTokenResultModel: GeneratePushNotificationTokenResultModel;
	ListChannelsResultModel: ListChannelsResultModel;
	DeleteNotificationGroupResultModel: DeleteNotificationGroupResultModel;
	SendStaticNotificationResultModel: SendStaticNotificationResultModel;
	EditNotificationGroupResultModel: EditNotificationGroupResultModel;
	AddUserToGroupResultModel: AddUserToGroupResultModel;
	RemoveUserToGroupResultModel: RemoveUserToGroupResultModel;
	CreateNotificationGroupResultModel: CreateNotificationGroupResultModel;
	MarkNotificationReadedResultModel: MarkNotificationReadedResultModel;
	ListNotificationGroupsResultModel: ListNotificationGroupsResultModel;
	ListNotificationsResultModel: ListNotificationsResultModel;
	GlobalErrorModel: GlobalErrorModel;
	NotificationModel: NotificationModel;
	NotificationGroupModel: NotificationGroupModel;
	NotificationReadedModel: NotificationReadedModel;
	ChannelModel: ChannelModel;
	PageOptionsResultModel: PageOptionsResultModel;
};