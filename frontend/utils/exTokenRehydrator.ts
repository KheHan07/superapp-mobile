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
import type { MicroApp } from "@/context/slices/appSlice";
import type { AppDispatch } from "@/context/store";
import { updateExchangedToken } from "@/context/slices/appSlice";
import { loadExchangedToken } from "./exchangedTokenStore";

/** After redux is hydrated (apps loaded), rehydrate tokens from SecureStore */
export async function restoreExchangedTokens(apps: MicroApp[], dispatch: AppDispatch) {
  await Promise.all(
    apps.map(async (app) => {
      try {
        const tok = await loadExchangedToken(app.appId);
        if (tok) {
          dispatch(updateExchangedToken({ appId: app.appId, exchangedToken: tok }));
        }
      } catch (e) {
        console.warn("RestoreExchangedTokens failed");
      }
    })
  );
}
