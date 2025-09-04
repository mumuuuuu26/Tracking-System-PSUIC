import React, { useEffect, useState } from "react";
import useEcomStore from "../../store/ecom-store";
import { createProduct } from "../../api/product";
import { toast } from "react-toastify";
import Uploadfile from "./Uploadfile";
import { Link } from "react-router-dom";

const initialState = {
  title: "Underripe Bunch",
  description: "des",
  price: 5,
  quantity: 5,
  categoryId: "",
  images: [],
};

const FormProduct = () => {
  const token = useEcomStore((state) => state.token);
  const getCategory = useEcomStore((state) => state.getCategory);
  const categories = useEcomStore((state) => state.categories);
  const getProduct = useEcomStore((state) => state.getProduct);
  const products = useEcomStore((state) => state.products);
  //console.log(products);
  const [form, setForm] = useState(initialState);

  useEffect(() => {
    //code
    getCategory(token);
    getProduct(token, 100);
  }, []);

  const handleOnChange = (e) => {
    console.log(e.target.name, e.target.value);
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createProduct(token, form);
      console.log(res);
      toast.success(`Add Product ${res.data.title} Success!!!`);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="container mx-auto p-4 bg-white shadow-md">
      <form onSubmit={handleSubmit}>
        <h1>เพิ่มข้อมูลสินค้า</h1>
        <input
          className="border"
          value={form.title}
          onChange={handleOnChange}
          placeholder="Title"
          name="title"
        />
        <input
          className="border"
          value={form.description}
          onChange={handleOnChange}
          placeholder="Description"
          name="description"
        />
        <input
          type="number"
          className="border"
          value={form.price}
          onChange={handleOnChange}
          placeholder="price"
          name="price"
        />
        <input
          type="number"
          className="border"
          value={form.quantity}
          onChange={handleOnChange}
          placeholder="quantity"
          name="quantity"
        />
        <select
          className="border"
          name="categoryId"
          onChange={handleOnChange}
          required
          value={form.categoryId}
        >
          <option value="" disabled>
            Please Select
          </option>
          {categories.map((item, index) => (
            <option key={index} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <hr />

        {/* Upload file */}
        <Uploadfile form={form} setForm={setForm} />

        <button className="bg-blue-300 rounded-md p-1 shadow-md">
          เพิ่มสินค้า
        </button>

        <hr />
        <br />
        <table className="w-full border-collapse border border-gray-300 rounded-lg shadow-md">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">No.</th>
              <th className="px-4 py-2 text-left">ชื่อสินค้า</th>
              <th className="px-4 py-2 text-left">รายละเอียด</th>
              <th className="px-4 py-2 text-center">ราคา</th>
              <th className="px-4 py-2 text-center">จำนวน</th>
              <th className="px-4 py-2 text-center">จำนวนที่ขาย</th>
              <th className="px-4 py-2 text-center">วันที่อัปเดต</th>
              <th className="px-4 py-2 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item, index) => (
              <tr
                key={index}
                className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition"
              >
                <td className="px-4 py-2">{index + 1}</td>
                <td className="px-4 py-2">{item.title}</td>
                <td className="px-4 py-2">{item.description}</td>
                <td className="px-4 py-2 text-center">{item.price}</td>
                <td className="px-4 py-2 text-center">{item.quantity}</td>
                <td className="px-4 py-2 text-center">{item.sold}</td>
                <td className="px-4 py-2 text-center">{item.updatedAt}</td>
                <td className="px-4 py-2 flex items-center gap-2 justify-center">
                  <Link
                    to={"/admin/product/" + item.id}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-1 rounded-md shadow"
                  >
                    แก้ไข
                  </Link>
                  <button>ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </form>
    </div>
  );
};

export default FormProduct;
