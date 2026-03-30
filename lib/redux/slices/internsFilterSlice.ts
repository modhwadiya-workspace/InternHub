import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface InternsFilterState {
  search: string;
  department_id: string;
  gender: string;
}

const initialState: InternsFilterState = {
  search: "",
  department_id: "",
  gender: "",
};

const internsFilterSlice = createSlice({
  name: "internsFilter",
  initialState,
  reducers: {
    setInternsSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    setInternsDepartment: (state, action: PayloadAction<string>) => {
      state.department_id = action.payload;
    },
    setInternsGender: (state, action: PayloadAction<string>) => {
      state.gender = action.payload;
    },
    resetInternsFilters: (state) => {
      state.search = "";
      state.department_id = "";
      state.gender = "";
    },
  },
});

export const { setInternsSearch, setInternsDepartment, setInternsGender, resetInternsFilters } = internsFilterSlice.actions;
export default internsFilterSlice.reducer;
