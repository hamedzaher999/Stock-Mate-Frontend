import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserProfile } from "@/lib/apiTypes";

interface AuthState {
  currentUser: UserProfile | null;
  permissions: string[];
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  currentUser: null,
  permissions: [],
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserProfile>) {
      state.currentUser = action.payload;
      state.permissions = action.payload.permissions ?? [];
      state.isAuthenticated = true;
    },
    logout(state) {
      state.currentUser = null;
      state.permissions = [];
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
