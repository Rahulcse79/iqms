// src/reducers/pendingQueryReducer.js
import { createSlice } from "@reduxjs/toolkit";
import {
  PENDING_QUERY_REQUEST,
  PENDING_QUERY_SUCCESS,
  PENDING_QUERY_FAIL,
} from "../constants/appConstants";

const initialState = {
  byKey: {},
  error: null,
};

const pendingQuerySlice = createSlice({
  name: "pending_queries",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addMatcher((action) => action.type === PENDING_QUERY_REQUEST, (state, action) => {
        const pendingWith = action.meta?.pendingWith;
        if (!pendingWith) return;
        state.byKey[pendingWith] = {
          ...(state.byKey[pendingWith] || {}),
          loading: true,
          error: null,
        };
      })
      .addMatcher((action) => action.type === PENDING_QUERY_SUCCESS, (state, action) => {
        const { pendingWith, items } = action.payload || {};
        if (!pendingWith) return;
        state.byKey[pendingWith] = {
          items: Array.isArray(items) ? items : [],
          loading: false,
          error: null,
        };
      })
      .addMatcher((action) => action.type === PENDING_QUERY_FAIL, (state, action) => {
        const pendingWith = action.meta?.pendingWith;
        const err = action.payload || action.error?.message || "Failed";
        if (!pendingWith) return;
        state.byKey[pendingWith] = {
          ...(state.byKey[pendingWith] || {}),
          loading: false,
          error: err,
        };
      });
  },
});

export default pendingQuerySlice.reducer;
