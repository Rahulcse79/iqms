import { createStore, combineReducers, applyMiddleware, compose } from "redux";
import { thunk } from "redux-thunk"; 
import { userReducer, repliedQueryReducer, officerBasicPayReasonReducer, officerRankHistoryReducer, searchQueryReducer, officerPersmastReducer, searchQueryByIdReducer, airmanBasicPayReasonReducer, searchQueryIdReducer, airmanRankHistoryReducer, airmanPersmastReducer } from "../reducers/reducers";
import {personalDataReducer, ProfileViewReducer, abcCodesReducer} from "../reducers/ProfileReducers";
import frqQryReducer, { faqReducer, queryReducer } from "../reducers/queryReducer";
import pendingQueryReducer from "../reducers/pendingQueryReducer";

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
  query_id: searchQueryIdReducer,
  query: queryReducer,
  profileView: ProfileViewReducer,
  abcCodes: abcCodesReducer,

  airmanPersmast: airmanPersmastReducer,
  airmanRankHistory: airmanRankHistoryReducer,
  airmanBasicPayReason: airmanBasicPayReasonReducer,
  officerPersmast: officerPersmastReducer,
  officerRankHistory: officerRankHistoryReducer,
  officerBasicPayReason: officerBasicPayReasonReducer,


  faqReducer: faqReducer,
  frqQryReducer: frqQryReducer,
  
  pending_queries: pendingQueryReducer,
  
});

const middleware = [thunk];

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  reducer,
  initialState,
  composeEnhancers(applyMiddleware(...middleware))
);


export default store;
