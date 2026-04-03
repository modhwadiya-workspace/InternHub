import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import internsFilterReducer from "./slices/internsFilterSlice";
import managersFilterReducer from "./slices/managersFilterSlice";

const rootReducer = combineReducers({
  internsFilter: internsFilterReducer,
  managersFilter: managersFilterReducer,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["internsFilter", "managersFilter"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
