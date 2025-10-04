// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { createTransform, persistReducer, persistStore } from "redux-persist";
import appReducer from "./slices/appSlice";
import appConfigReducer from "./slices/appConfigSlice";
import authReducer from "./slices/authSlice";
import deviceReducer from "./slices/deviceSlice";
import userConfigReducer from "./slices/userConfigSlice";
import userInfoReducer from "./slices/userInfoSlice";
import versionReducer from "./slices/versionSlice";

// Strip exchangedToken from the apps array BEFORE persisting
const stripExchangedTokens = createTransform(
  (inbound: any) => {
    if (!inbound?.apps) return inbound;
    return {
      ...inbound,
      apps: inbound.apps.map((a: any) => ({ ...a, exchangedToken: "" })),
    };
  },
  (outbound: any) => outbound,
  { whitelist: ["apps"] }
);

const authPersistConfig = {
  key: "auth",
  storage: AsyncStorage,
  whitelist: ["auth"],
};

const appsPersistConfig = {
  key: "apps",
  storage: AsyncStorage,
  whitelist: ["apps"],
  transforms: [stripExchangedTokens],
};

const userConfigPersistConfig = {
  key: "user-config",
  storage: AsyncStorage,
  whitelist: ["user-config"],
};

const userInfoPersistConfig = {
  key: "user-info",
  storage: AsyncStorage,
  whitelist: ["user-info"],
};

const appConfigPersistConfig = {
  key: "app-config",
  storage: AsyncStorage,
  whitelist: ["appConfig"],
};

const appReducerCombined = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  apps: persistReducer(appsPersistConfig, appReducer),
  userConfig: persistReducer(userConfigPersistConfig, userConfigReducer),
  version: versionReducer,
  userInfo: persistReducer(userInfoPersistConfig, userInfoReducer),
  device: deviceReducer,
  appConfig: persistReducer(appConfigPersistConfig, appConfigReducer),
});

const rootReducer = (
  state: ReturnType<typeof appReducerCombined> | undefined,
  action: any
) => {
  if (action.type === "auth/resetAll") {
    state = undefined;
  }
  return appReducerCombined(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
