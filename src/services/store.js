import { httpGet } from './axios';
import Store from '../models/store';
import FrequentQuestions from '../models/frequentQuestion';


export const constructStore = async () => {
  await Store.deleteMany();
  const url = 'rest/V1/store/storeConfigs';
  const listStores = await httpGet(url);
  let stores = [];
  for (const store of listStores) {
    const storeInStores = stores.filter(storeInList => storeInList.store_id === store.website_id)[0];
    const indexStoreInStores = stores.indexOf(storeInStores);
    if (indexStoreInStores == -1) {
      const formatStore = {
        store_id: store.website_id,
        storeViews: [
          {
            id: store.id,
            codde: store.code
          }
        ]
      }
      stores.push(formatStore);
    } else {
      const storeView = {
        id: store.id,
        codde: store.code
      }
      stores[indexStoreInStores].storeViews.push(storeView)
    }
  }
  stores = await Store.insertMany(stores);
  return stores;
}
export const getStores = async () => {
  let listStore = await Store.find({}, { _id: 0, __v: 0 });
  if (!listStore || listStore.length == 0) {
    listStore = await constructStore();
  }
  return listStore;
}

export const setFrequentQuestions = async (frequentQuestion) => {
  if(frequentQuestion) {
    const frequentQuestions = await FrequentQuestions.create(frequentQuestion);
    return frequentQuestions;
  }
};