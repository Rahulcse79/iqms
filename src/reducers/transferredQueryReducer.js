// src/reducers/transferredQueryReducer.js
import { createSlice } from "@reduxjs/toolkit";
import {
  TRANSFERRED_QUERY_REQUEST,
  TRANSFERRED_SUCCESS,
  TRANSFERRED_FAIL,
} from "../constants/appConstants";

const initialState = {
  byKey: {},
  error: null,
};

const transferredQuerySlice = createSlice({
  name: "transferred_queries",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addMatcher((action) => action.type === TRANSFERRED_QUERY_REQUEST, (state, action) => {
        const pendingWith = action.meta?.pendingWith;
        if (!pendingWith) return;
        state.byKey[pendingWith] = {
          ...(state.byKey[pendingWith] || {}),
          loading: true,
          error: null,
        };
      })
      .addMatcher((action) => action.type === TRANSFERRED_SUCCESS, (state, action) => {
        const { pendingWith, items } = action.payload || {};
        if (!pendingWith) return;
        state.byKey[pendingWith] = {
          items: Array.isArray(items) ? items : [],
          loading: false,
          error: null,
        };
      })
      .addMatcher((action) => action.type === TRANSFERRED_FAIL, (state, action) => {
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

export default transferredQuerySlice.reducer;
