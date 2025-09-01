import {
  SEARCH_QUERY_REQUEST,
  SEARCH_QUERY_SUCCESS,
  SEARCH_QUERY_FAIL,
  CLEAR_QUERY_RESULTS,
} from "../constants/queryConstants";

const initialSlotState = { loading: false, items: [], error: null };

const initialState = {
  slot1: { ...initialSlotState },
  slot2: { ...initialSlotState },
  slot3: { ...initialSlotState },
};

export const queryReducer = (state = initialState, action) => {
  const { type, payload, meta } = action;

  switch (type) {
    case SEARCH_QUERY_REQUEST:
      return {
        ...state,
        [`slot${meta.slot}`]: { ...state[`slot${meta.slot}`], loading: true, error: null, items: [] },
      };

    case SEARCH_QUERY_SUCCESS:
      return {
        ...state,
        [`slot${meta.slot}`]: { loading: false, items: payload, error: null },
      };

    case SEARCH_QUERY_FAIL:
      return {
        ...state,
        [`slot${meta.slot}`]: { loading: false, items: [], error: payload },
      };

    case CLEAR_QUERY_RESULTS:
      return initialState;

    default:
      return state;
  }
};
