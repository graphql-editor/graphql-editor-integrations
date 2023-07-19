import { QueryModel } from './QueryModel.js'
import { StripeCustomerQueryOpsModel } from './StripeCustomerQueryOpsModel.js'
import { MutationModel } from './MutationModel.js'
import { StripeCustomerMutationOpsModel } from './StripeCustomerMutationOpsModel.js'
import { StripeCustomerModel } from './StripeCustomerModel.js'
import { AddressModel } from './AddressModel.js'
import { StoreModel } from './StoreModel.js'
import { DimensionsModel } from './DimensionsModel.js'
import { ProductModel } from './ProductModel.js'
import { CustomUnitAmountModel } from './CustomUnitAmountModel.js'
import { PriceRecurringModel } from './PriceRecurringModel.js'
import { TransformQuantityModel } from './TransformQuantityModel.js'
import { PriceModel } from './PriceModel.js'
import { ProductsPageModel } from './ProductsPageModel.js'
import { PricesPageModel } from './PricesPageModel.js'


export type Models = {
	QueryModel: QueryModel;
	StripeCustomerQueryOpsModel: StripeCustomerQueryOpsModel;
	MutationModel: MutationModel;
	StripeCustomerMutationOpsModel: StripeCustomerMutationOpsModel;
	StripeCustomerModel: StripeCustomerModel;
	AddressModel: AddressModel;
	StoreModel: StoreModel;
	DimensionsModel: DimensionsModel;
	ProductModel: ProductModel;
	CustomUnitAmountModel: CustomUnitAmountModel;
	PriceRecurringModel: PriceRecurringModel;
	TransformQuantityModel: TransformQuantityModel;
	PriceModel: PriceModel;
	ProductsPageModel: ProductsPageModel;
	PricesPageModel: PricesPageModel;
};