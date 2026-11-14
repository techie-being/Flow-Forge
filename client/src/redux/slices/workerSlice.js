import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { flowForgeApi } from "../../api/flowForgeApi";

export const fetchAllWorkers = createAsyncThunk("workers/getAll", async (_, { rejectWithValue }) => {
  try {
    const res = await flowForgeApi.getAllWorkers();
    return res.data || [];
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const registerNewWorker = createAsyncThunk(
  "workers/register",
  async (workerData, { rejectWithValue }) => {
    try {
      const res = await flowForgeApi.registerWorker(workerData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchWorkerById = createAsyncThunk("workers/getById", async (id, { rejectWithValue }) => {
  try {
    const res = await flowForgeApi.getWorkerById(id);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const changeWorkerStatus = createAsyncThunk(
  "workers/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await flowForgeApi.updateWorkerStatus(id, status);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const workerSlice = createSlice({
  name: "workers",
  initialState: {
    items: [],
    selectedWorker: null,
    loading: false,
    submitting: false,
    error: null,
  },
  reducers: {
    clearSelectedWorker: (state) => {
      state.selectedWorker = null;
    },
    clearWorkerError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllWorkers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllWorkers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAllWorkers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerNewWorker.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(registerNewWorker.fulfilled, (state, action) => {
        state.submitting = false;
        if (action.payload) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(registerNewWorker.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      .addCase(fetchWorkerById.fulfilled, (state, action) => {
        state.selectedWorker = action.payload;
      })
      .addCase(fetchWorkerById.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(changeWorkerStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        if (!updated) return;
        const idx = state.items.findIndex((w) => w.id === updated.id);
        if (idx !== -1) state.items[idx] = updated;
        if (state.selectedWorker?.id === updated.id) {
          state.selectedWorker = updated;
        }
      })
      .addCase(changeWorkerStatus.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearSelectedWorker, clearWorkerError } = workerSlice.actions;
export default workerSlice.reducer;