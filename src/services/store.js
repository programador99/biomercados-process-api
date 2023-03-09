import { httpGet } from './axios';
import Store from '../models/store';
import FrequentQuestions from '../models/frequentQuestion';

const storeLocalInfo = {
  2: {
    name: 'Gran Valencia',
    phone: "+584122462263",
    address: "Calle callejon manongo, terreno civico c-20"
  },
  5: {
    name: 'Paraparal',
    phone: "+584141429192",
    address: "Avenida principal, calle Esperanza, a 100mtrs de la iglesia de los cerritos."
  },
  7: {
    name: 'Cabudare',
    phone: "+584244056282",
    address: "Avenida El Placer con avenida Bolívar, local Nro S/N, sector La Mendera"
  }
}

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
            codde: store.code,
          }
        ],
        ...storeLocalInfo[store.id]
      }
      stores.push(formatStore);
    } else {
      const storeView = {
        id: store.id,
        codde: store.code,
      }
      stores[indexStoreInStores].storeViews.push(storeView);
      stores[indexStoreInStores] = {
        ...stores[indexStoreInStores],
        ...storeLocalInfo[store.i]
      }
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
  if (frequentQuestion) {
    const frequentQuestions = await FrequentQuestions.create(frequentQuestion);
    return frequentQuestions;
  }
};

export const getStoreByViewId = async (viewId) => {
  if (viewId && viewId > 0) {
    const store = await Store.find({ storeView: { $elementMatch: { id: viewId } } }, { __v: 0, _id: 0 });
    return store[0].store_id;
  }
}