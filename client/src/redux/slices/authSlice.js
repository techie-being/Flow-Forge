import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { flowForgeApi } from "../../api/flowForgeApi";

export const fetchCurrentUser = createAsyncThunk("auth/me", async (_, { rejectWithValue }) => {
  try {
    const res = await flowForgeApi.getCurrentUser();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const registerUser = createAsyncThunk(
  "auth/register",
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    try {
      await flowForgeApi.registerUser(email, password);
      return await dispatch(fetchCurrentUser()).unwrap();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await flowForgeApi.loginUser(email, password);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const logoutUser = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  try {
    await flowForgeApi.logoutUser();
    return null;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchUserProfile = createAsyncThunk(
  "auth/profile",
  async (username, { rejectWithValue }) => {
    try {
      const res = await flowForgeApi.getUserProfile(username);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: true,
    authError: null,
    viewedProfile: null,
    profileLoading: false,
    profileError: null,
  },
  reducers: {
    clearAuthError: (state) => {
      state.authError = null;
    },
    clearViewedProfile: (state) => {
      state.viewedProfile = null;
      state.profileError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = Boolean(action.payload);
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.authError = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.authError = action.payload;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.authError = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.authError = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.authError = null;
      })
      .addCase(fetchUserProfile.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.viewedProfile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.viewedProfile = null;
        state.profileError = action.payload;
      });
  },
});

export const { clearAuthError, clearViewedProfile } = authSlice.actions;
export default authSlice.reducer;