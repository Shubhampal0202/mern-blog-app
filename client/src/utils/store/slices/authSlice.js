import { createSlice } from "@reduxjs/toolkit";
const userFromStorage = localStorage.getItem("user");
const initialState = {
  userAuth: userFromStorage ? JSON.parse(userFromStorage) : null,
};
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    signin: (state, action) => {
      state.userAuth = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.userAuth = null;
      localStorage.removeItem("user");
    },
  },
});
export const { signin, logout } = authSlice.actions;
export default authSlice.reducer;
