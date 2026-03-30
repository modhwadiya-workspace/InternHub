import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ManagersFilterState {
  search: string;
  department_id: string;
  gender: string;
}

const initialState: ManagersFilterState = {
  search: "",
  department_id: "",
  gender: "",
};

const managersFilterSlice = createSlice({
  name: "managersFilter",
  initialState,
  reducers: {
    setManagersSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    setManagersDepartment: (state, action: PayloadAction<string>) => {
      state.department_id = action.payload;
    },
    setManagersGender: (state, action: PayloadAction<string>) => {
      state.gender = action.payload;
    },
    resetManagersFilters: (state) => {
      state.search = "";
      state.department_id = "";
      state.gender = "";
    },
  },
});

export const { setManagersSearch, setManagersDepartment, setManagersGender, resetManagersFilters } = managersFilterSlice.actions;
export default managersFilterSlice.reducer;
