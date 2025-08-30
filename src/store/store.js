import { createStore, combineReducers, applyMiddleware, compose } from "redux";
import { thunk } from "redux-thunk"; 
import { userReducer, personalDataReducer, repliedQueryReducer, searchQueryReducer, searchQueryByIdReducer } from "../reducers/reducers";

const initialState = {
  login_user: {
    user: {
      name: "Admin",
      role: "Administrator",
    },
  },
};

const reducer = combineReducers({
  login_user: userReducer,
  personalData: personalDataReducer,
  replied_queries: repliedQueryReducer,
  search_queries: searchQueryReducer,
  query_by_id: searchQueryByIdReducer,
});

const middleware = [thunk];

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  reducer,
  initialState,
  composeEnhancers(applyMiddleware(...middleware))
);

export default store;
