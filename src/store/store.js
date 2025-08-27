import { createStore, combineReducers, applyMiddleware } from "redux";
import { thunk } from "redux-thunk";
import { composeWithDevTools } from "redux-devtools-extension";
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

const store = createStore(
  reducer,
  initialState,
  composeWithDevTools(applyMiddleware(...middleware))
);

export default store;
