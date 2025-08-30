import {
    LOGIN_USER_REQUEST,
    LOGIN_USER_SUCCESS,
    LOGIN_USER_FAIL,
    LOAD_USER_REQUEST,
    LOAD_USER_SUCCESS,
    LOAD_USER_FAIL,
    LOGOUT_USER_SUCCESS,
    LOGOUT_USER_FAIL,
    CLEAR_ERRORS,
    FETCH_PERSONAL_DATA_REQUEST,
    FETCH_PERSONAL_DATA_SUCCESS,
    FETCH_PERSONAL_DATA_FAIL,
    REPLIED_QUERY_REQUEST,
    REPLIED_QUERY_SUCCESS,
    REPLIED_QUERY_FAIL,
    SEARCH_QUERY_REQUEST,
    SEARCH_QUERY_SUCCESS,
    SEARCH_QUERY_FAIL,
    SEARCH_QUERY_BY_ID_REQUEST,
    SEARCH_QUERY_BY_ID_SUCCESS,
    SEARCH_QUERY_BY_ID_FAIL,
} from '../constants/appConstants';

export const searchQueryByIdReducer = (state = { item: null }, action) => {
    switch (action.type) {
        case SEARCH_QUERY_BY_ID_REQUEST:
            return { ...state, loading: true, error: null };

        case SEARCH_QUERY_BY_ID_SUCCESS:
            return {
                loading: false,
                item: action.payload.items[0] || null,
                count: action.payload.count,
            };

        case SEARCH_QUERY_BY_ID_FAIL:
            return { loading: false, error: action.payload, item: null };

        default:
            return state;
    }
};

export const searchQueryReducer = (state = { items: [] }, action) => {
    switch (action.type) {
        case SEARCH_QUERY_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
            };
        case SEARCH_QUERY_SUCCESS:
            return {
                loading: false,
                items: action.payload.items,
                count: action.payload.count,
                hasMore: action.payload.hasMore,
            };
        case SEARCH_QUERY_FAIL:
            return {
                loading: false,
                error: action.payload,
                items: [],
            };
        default:
            return state;
    }
};

const initialState = {
    loading: false,
    personalData: null,
    error: null,
};

export const repliedQueryReducer = (state = { items: [] }, action) => {
    switch (action.type) {
        case REPLIED_QUERY_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
            };
        case REPLIED_QUERY_SUCCESS:
            return {
                loading: false,
                items: action.payload,
            };
        case REPLIED_QUERY_FAIL:
            return {
                loading: false,
                error: action.payload,
                items: [],
            };
        default:
            return state;
    }
};

export const personalDataReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_PERSONAL_DATA_REQUEST:
            return { ...state, loading: true };
        case FETCH_PERSONAL_DATA_SUCCESS:
            return { loading: false, personalData: action.payload, error: null };
        case FETCH_PERSONAL_DATA_FAIL:
            return { loading: false, personalData: null, error: action.payload };
        default:
            return state;
    }
};

export const userReducer = (state = { user: {} }, { type, payload }) => {
    switch (type) {
        case LOGIN_USER_REQUEST:
        case LOAD_USER_REQUEST:
            return {
                loading: true,
                isAuthenticated: false,
            };
        case LOGIN_USER_SUCCESS:
        case LOAD_USER_SUCCESS:
            return {
                ...state,
                loading: false,
                isAuthenticated: true,
                user: payload,
            };
        case LOGOUT_USER_SUCCESS:
            return {
                loading: false,
                user: null,
                isAuthenticated: false,
            };
        case LOGIN_USER_FAIL:
            return {
                ...state,
                loading: false,
                isAuthenticated: false,
                user: null,
                error: payload,
            };
        case LOAD_USER_FAIL:
            return {
                loading: false,
                isAuthenticated: false,
                user: null,
                error: payload,
            }
        case LOGOUT_USER_FAIL:
            return {
                ...state,
                loading: false,
                error: payload,
            }
        case CLEAR_ERRORS:
            return {
                ...state,
                error: null,
            };
        default:
            return state;
    }
};