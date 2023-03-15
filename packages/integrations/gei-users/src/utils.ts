export type ResponseWithMeta<ResponseType, MetaType> = {
    response: ResponseType;
    __meta: MetaType;
  };