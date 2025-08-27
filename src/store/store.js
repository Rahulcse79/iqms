import { createStore, combineReducers, applyMiddleware, compose } from "redux";
import { thunk } from "redux-thunk";
import { allReducer } from "../reducers/allReducers";

const initialState = {
  user: {
    name: "Admin",
    role: "Administrator",
  },
};

const reducer = combineReducers({
  login_user: allReducer,
});

const middleware = [thunk];

// ✅ use Redux DevTools if available, else fallback to Redux compose
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  reducer,
  initialState,
  composeEnhancers(applyMiddleware(...middleware))
);

export default store;
