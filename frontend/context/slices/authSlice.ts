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
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  AuthData,
  loadAuthData,
  logout,
  refreshAccessToken,
} from "../../services/authService";
import { getItemAsync, setItemAsync } from "expo-secure-store";
import { removeGoogleAuthState } from "@/services/googleService";
import { getAppConfigurations } from "./appConfigSlice";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  email: AuthData["email"] | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  idToken: null,
  email: null,
  isLoading: false,
};

// Async action to restore persisted auth state
export const restoreAuth = createAsyncThunk(
  "auth/restoreAuth",
  async (_, { dispatch }) => {
    let authData = await loadAuthData();

    if (authData) {
      const isExpired = authData.expiresAt && Date.now() >= authData.expiresAt;

      if (isExpired) {
        authData = await refreshAccessToken(logout);
      }
      // Load app configurations after restoring auth
      if (authData) {
        try {
          await dispatch(getAppConfigurations(logout)).unwrap();
        } catch (configError) {
          console.error("Failed to load app configurations", configError);
        }
      }

      return authData;
    }

    return null;
  }
);

// Async action to set auth and check Google auth state
export const setAuthWithCheck = createAsyncThunk(
  "auth/setAuthWithCheck",
  async (authPayload: AuthData, { dispatch }) => {
    const previousAuthMail = await getItemAsync("authMail");
    if (previousAuthMail) {
      const parsedMail = JSON.parse(previousAuthMail);
      if (authPayload.email && authPayload.email !== parsedMail) {
        await removeGoogleAuthState();
      }
    }

    await setItemAsync("authMail", JSON.stringify(authPayload.email));
    dispatch(setAuth(authPayload));
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.idToken = action.payload.idToken;
      state.email = action.payload.email;
      state.isLoading = false;
    },
    resetAll: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.idToken = action.payload.idToken;
          state.email = action.payload.email;
        }
        state.isLoading = false;
      })
      .addCase(setAuthWithCheck.fulfilled, (state) => {
        state.isLoading = false;
      });
  },
});

export const { setAuth, resetAll } = authSlice.actions;
export default authSlice.reducer;
