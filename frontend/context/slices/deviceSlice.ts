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
import { BASE_URL } from "@/constants/Constants";
import { apiRequest } from "@/utils/requestHandler";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  deleteItemAsync,
  getItem,
  getItemAsync,
  setItem,
} from "expo-secure-store";

interface DeviceState {
  isPushingToken: boolean;
  fcmPushError: string | null;
  lastSentFCMToken: string | null;
}

const initialState: DeviceState = {
  isPushingToken: false,
  fcmPushError: null,
  lastSentFCMToken: null,
};

// Hydrate the last sent FCM token
export const loadLastSentFCMToken = createAsyncThunk(
  "device/loadLastSentFCMToken",
  async () => {
    try {
      const token = getItem("lastSentFCMToken");
      return token;
    } catch (error) {
      console.error("Error loading last sent FCM token:", error);
      return null;
    }
  }
);

/**
 * Disables the FCM token by deleting it from the DB.
 */
export const disableFCMToken = createAsyncThunk(
  "device/disableFCMToken",
  async (_, { rejectWithValue }) => {
    try {
      const fcmToken = await getItemAsync("lastSentFCMToken");
      if (!fcmToken) {
        return rejectWithValue("No FCM token found");
      }
      const url = `${BASE_URL}/users/fcm-tokens?fcmToken=${fcmToken}`;

      const response = await apiRequest(
        {
          url,
          method: "DELETE",
        },
        async () => {}
      );

      if (response?.status === 200) {
        return response.data;
      } else {
        console.warn("Failed to delete FCM token");
        return rejectWithValue("Failed to delete FCM token");
      }
    } catch (error: any) {
      console.error("Error occurred while deleting FCM token:", error);
      return rejectWithValue(error);
    }
  }
);

/**
 * Pushes the FCM token to the backend. This is called when the user is authenticated.
 */
export const pushFCMToken = createAsyncThunk(
  "device/pushFCMToken",
  async (
    { fcmToken, onLogout }: { fcmToken: string; onLogout: () => Promise<void> },
    { rejectWithValue }
  ) => {
    try {
      const url = `${BASE_URL}/users/fcm-tokens?fcmToken=${fcmToken}`;
      const response = await apiRequest(
        {
          url,
          method: "POST",
        },
        onLogout
      );

      if (response?.status === 200) {
        return response.data;
      } else {
        console.warn("Failed to push FCM token");
        return rejectWithValue("Failed to push FCM token");
      }
    } catch (error: any) {
      console.error("Failed to push FCM token:", error);
      return rejectWithValue(error);
    }
  }
);
const deviceSlice = createSlice({
  name: "device",
  initialState,
  reducers: {
    clearDeviceState: (state) => {
      state.isPushingToken = false;
      state.fcmPushError = null;
      state.lastSentFCMToken = null;
      deleteItemAsync("lastSentFCMToken");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadLastSentFCMToken.fulfilled, (state, action) => {
        state.lastSentFCMToken = action.payload;
      })
      .addCase(pushFCMToken.pending, (state) => {
        state.isPushingToken = true;
        state.fcmPushError = null;
      })
      .addCase(pushFCMToken.fulfilled, (state, action) => {
        state.isPushingToken = false;
        state.lastSentFCMToken = action.meta.arg.fcmToken;
        setItem("lastSentFCMToken", action.meta.arg.fcmToken);
      })
      .addCase(pushFCMToken.rejected, (state, action) => {
        state.isPushingToken = false;
        state.fcmPushError = action.payload as string;
      });
  },
});

export const { clearDeviceState } = deviceSlice.actions;
export default deviceSlice.reducer;
