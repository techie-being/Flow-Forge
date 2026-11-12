import { createSlice } from "@reduxjs/toolkit";

const storedUser = JSON.parse(localStorage.getItem("user"));

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: storedUser || null,
    isLoggedIn: !!storedUser,
    authInitialized: false,
    loading: false,
    error: null,
  },

  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.user = action.payload;
      state.isLoggedIn = true;
      state.authInitialized = true;
      state.loading = false;
      state.error = null;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.user = null;
      state.isLoggedIn = false;
    },
    logout: (state) => {
      state.user = null;
      state.isLoggedIn = false;
      state.authInitialized = true;
      state.loading = false;
      state.error = null;
      localStorage.removeItem("user");
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
    setAuthInitialized: (state) => {
      state.authInitialized = true;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  setAuthInitialized,
} = authSlice.actions;

export default authSlice.reducer;
