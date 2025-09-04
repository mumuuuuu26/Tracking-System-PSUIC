import axios from "axios";

export const createProduct = async (token, form) => {
  //code body
  return axios.post("http://localhost:5001/api/product", form, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
export const listProduct = async (token, count = 20) => {
  //code body
  return axios.get("http://localhost:5001/api/products/" + count, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const readProduct = async (token, id) => {
  //code body
  return axios.get("http://localhost:5001/api/product/" + id, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateProduct = async (token, id, form) => {
  //code body
  return axios.put("http://localhost:5001/api/product/" + id, form, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const uploadFiles = async (token, form) => {
  //code body
  console.log("form api fronent", form);
  return axios.post(
    "http://localhost:5001/api/images",
    {
      Image: form,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const removeFiles = async (token, public_id) => {
  //code body
  //console.log("form api fronent", form);
  return axios.post(
    "http://localhost:5001/api/removeimages",
    {
      public_id,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};
