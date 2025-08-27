import { 
    LOGOUT_SELLER_SUCCESS,
    LOGOUT_SELLER_FAIL,
    LOGIN_SELLER_REQUEST,
    LOGIN_SELLER_SUCCESS,
    LOGIN_SELLER_FAIL,
    CLEAR_ERRORS,
} from "../constants/appConstants";

export const allReducer = (state = { data: {} }, { type, payload }) => {
    switch (type) {
        case LOGIN_SELLER_REQUEST:
            return {
                loading: true,
                isAuthenticated: false,
            };

        case LOGIN_SELLER_SUCCESS:
            return {
                ...state,
                loading: false,
                isAuthenticated: true,
                payload: payload,
            };

        case LOGIN_SELLER_FAIL:
            return {
                ...state,
                loading: false,
                isAuthenticated: false,
                error: payload,
            };

        case LOGOUT_SELLER_SUCCESS:
            return {
                loading: false,
                isAuthenticated: false,
                payload: null,
            };

        case LOGOUT_SELLER_FAIL:
            return {
                ...state,
                loading: false,
                error: payload,
            };

        case CLEAR_ERRORS:
            return {
                ...state,
                error: null,
            };

        default:
            return state;
    }
};
