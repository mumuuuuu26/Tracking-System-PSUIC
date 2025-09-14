import axios from "axios";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { listCategory } from "../api/Category";
import { listProduct } from "../api/product";

const ecomStore = (set, get) => ({
  user: null,
  token: null,
  categories: [],
  products: [],

  // --- Auth ---
  actionLogin: async (form) => {
    const res = await axios.post("http://localhost:5001/api/login", form);
    set({
      user: res.data.payload,
      token: res.data.token,
    });
    return res;
  },

  logout: () => {
    set({ user: null, token: null, categories: [], products: [] });
    localStorage.removeItem("ecom-store");
  },
  // --- Data loaders ---
  getCategory: async (tokenArg) => {
    try {
      const token = tokenArg ?? get().token;
      const res = await listCategory(token);
      set({ categories: res.data });
    } catch (err) {
      console.log(err);
    }
  },

  getProduct: async (tokenArg, count) => {
    try {
      const token = tokenArg ?? get().token;
      const res = await listProduct(token, count);
      set({ products: res.data });
    } catch (err) {
      console.log(err);
    }
  },
});

const usePersist = {
  name: "ecom-store",
  storage: createJSONStorage(() => localStorage),
};

const useEcomStore = create(persist(ecomStore, usePersist));

export default useEcomStore;
