import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { flowForgeApi } from "../../api/flowForgeApi";

export const fetchAllTasks = createAsyncThunk("tasks/getAll", async (_, { rejectWithValue }) => {
  try {
    const res = await flowForgeApi.getAllTasks();
    return res.data || [];
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createNewTask = createAsyncThunk(
  "tasks/create",
  async ({ description, pdfFile }, { rejectWithValue }) => {
    try {
      const res = await flowForgeApi.createTask(description, pdfFile);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchTaskById = createAsyncThunk("tasks/getById", async (id, { rejectWithValue }) => {
  try {
    const res = await flowForgeApi.getTaskById(id);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const removeTaskById = createAsyncThunk("tasks/delete", async (id, { rejectWithValue }) => {
  try {
    await flowForgeApi.deleteTask(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const taskSlice = createSlice({
  name: "tasks",
  initialState: {
    items: [],
    selectedTask: null,
    loading: false,
    submitting: false,
    error: null,
  },
  reducers: {
    clearSelectedTask: (state) => {
      state.selectedTask = null;
    },
    clearTaskError: (state) => {
      state.error = null;
    },
    resetTasks: (state) => {
      state.items = [];
      state.selectedTask = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAllTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createNewTask.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(createNewTask.fulfilled, (state, action) => {
        state.submitting = false;
        if (action.payload) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(createNewTask.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.selectedTask = action.payload;
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(removeTaskById.fulfilled, (state, action) => {
        state.items = state.items.filter((task) => task.id !== action.payload);
        if (state.selectedTask?.id === action.payload) {
          state.selectedTask = null;
        }
      })
      .addCase(removeTaskById.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearSelectedTask, clearTaskError, resetTasks } = taskSlice.actions;
export default taskSlice.reducer;