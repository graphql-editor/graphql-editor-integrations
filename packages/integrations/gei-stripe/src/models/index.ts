import { QueryModel } from './QueryModel.js'
import { MutationModel } from './MutationModel.js'
import { UserModel } from './UserModel.js'
import { StripeCustomerModel } from './StripeCustomerModel.js'
import { AddressModel } from './AddressModel.js'
import { DimensionsModel } from './DimensionsModel.js'
import { ProductModel } from './ProductModel.js'
import { CustomUnitAmountModel } from './CustomUnitAmountModel.js'
import { PriceRecurringModel } from './PriceRecurringModel.js'
import { TransformQuantityModel } from './TransformQuantityModel.js'
import { PriceModel } from './PriceModel.js'
import { ProductsPageModel } from './ProductsPageModel.js'


export type Models = {
	QueryModel: QueryModel;
	MutationModel: MutationModel;
	UserModel: UserModel;
	StripeCustomerModel: StripeCustomerModel;
	AddressModel: AddressModel;
	DimensionsModel: DimensionsModel;
	ProductModel: ProductModel;
	CustomUnitAmountModel: CustomUnitAmountModel;
	PriceRecurringModel: PriceRecurringModel;
	TransformQuantityModel: TransformQuantityModel;
	PriceModel: PriceModel;
	ProductsPageModel: ProductsPageModel;
};