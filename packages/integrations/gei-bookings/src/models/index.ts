import { QueryModel } from './QueryModel.js'
import { UserQueryModel } from './UserQueryModel.js'
import { MutationModel } from './MutationModel.js'
import { PublicQueryModel } from './PublicQueryModel.js'
import { UserMutationModel } from './UserMutationModel.js'
import { GetBookingsForServiceRespondModel } from './GetBookingsForServiceRespondModel.js'
import { GetSelfServicesRespondModel } from './GetSelfServicesRespondModel.js'
import { RespondOnServiceRequestRespondModel } from './RespondOnServiceRequestRespondModel.js'
import { GetBooksRepsondModel } from './GetBooksRepsondModel.js'
import { ListServicesRespondModel } from './ListServicesRespondModel.js'
import { GetServiceRespondModel } from './GetServiceRespondModel.js'
import { RegisterServiceRespondModel } from './RegisterServiceRespondModel.js'
import { UpdateServiceRespondModel } from './UpdateServiceRespondModel.js'
import { RemoveServiceRespondModel } from './RemoveServiceRespondModel.js'
import { BookServiceRespondModel } from './BookServiceRespondModel.js'
import { UserServiceRespondModel } from './UserServiceRespondModel.js'
import { ServiceModel } from './ServiceModel.js'
import { BookingRecordModel } from './BookingRecordModel.js'
import { GlobalErrorModel } from './GlobalErrorModel.js'


export type Models = {
	QueryModel: QueryModel;
	UserQueryModel: UserQueryModel;
	MutationModel: MutationModel;
	PublicQueryModel: PublicQueryModel;
	UserMutationModel: UserMutationModel;
	GetBookingsForServiceRespondModel: GetBookingsForServiceRespondModel;
	GetSelfServicesRespondModel: GetSelfServicesRespondModel;
	RespondOnServiceRequestRespondModel: RespondOnServiceRequestRespondModel;
	GetBooksRepsondModel: GetBooksRepsondModel;
	ListServicesRespondModel: ListServicesRespondModel;
	GetServiceRespondModel: GetServiceRespondModel;
	RegisterServiceRespondModel: RegisterServiceRespondModel;
	UpdateServiceRespondModel: UpdateServiceRespondModel;
	RemoveServiceRespondModel: RemoveServiceRespondModel;
	BookServiceRespondModel: BookServiceRespondModel;
	UserServiceRespondModel: UserServiceRespondModel;
	ServiceModel: ServiceModel;
	BookingRecordModel: BookingRecordModel;
	GlobalErrorModel: GlobalErrorModel;
};