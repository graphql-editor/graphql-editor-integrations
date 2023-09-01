import { iGraphQL } from 'i-graphql';
import { ObjectId } from 'mongodb';

export const orm = async () => {
  console.log('IGraphQl');
  //const modell = collection.replace("Collection", "Model")

  return iGraphQL<Record<string, any>, { _id: () => string; createdAt: () => string }>({
    _id: () => new ObjectId().toHexString(),
    createdAt: () => new Date().toISOString(),
  });
};

export async function DB() {
  return orm();
}
