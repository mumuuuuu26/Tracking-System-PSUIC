import React, { useState } from "react";
import { toast } from "react-toastify";
import Resizer from "react-image-file-resizer";
import { removeFiles, uploadFiles } from "../../api/product";
import useEcomStore from "../../store/ecom-store";

const Uploadfile = ({ form, setForm }) => {
  const token = useEcomStore((state) => state.token);
  const [isLoading, setIsLoading] = useState(false);

  const handleOnChange = (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    setIsLoading(true);
    // ทำสำเนา array ปัจจุบัน ป้องกันการ mutate ตรงๆ
    const next = [...(form.images || [])];

    const work = Array.from(files).map((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`ไฟล์ ${file.name} ไม่ใช่รูปภาพ`);
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        Resizer.imageFileResizer(
          file,
          720,
          720,
          "JPEG",
          100,
          0,
          (data) => {
            uploadFiles(token, data)
              .then((res) => {
                next.push(res.data);
                resolve();
              })
              .catch((err) => {
                console.log(err);
                resolve();
              });
          },
          "base64"
        );
      });
    });

    Promise.all(work).then(() => {
      setForm({ ...form, images: next });
      setIsLoading(false);
      toast.success("อัปโหลดรูปสำเร็จ");
      // reset input
      e.target.value = "";
    });
  };

  const handleDelete = (public_id) => {
    const images = form.images || [];
    removeFiles(token, public_id)
      .then((res) => {
        const filterImages = images.filter(
          (item) => item.public_id !== public_id
        );
        setForm({ ...form, images: filterImages });
        toast.error("ลบรูปสำเร็จ");
      })
      .catch((err) => {
        console.log(err);
        toast.error("ลบรูปไม่สำเร็จ");
      });
  };

  return (
    <div className="my-4 space-y-3">
      {/* Preview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {(form.images || []).map((item, index) => (
          <div key={index} className="relative group">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={item.url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => handleDelete(item.public_id)}
              className="absolute -top-2 -right-2 hidden group-hover:block bg-red-500 text-white text-xs rounded-full px-2 py-1 shadow"
              title="ลบรูปนี้"
            >
              Delete
            </button>
          </div>
        ))}
        {(!form.images || form.images.length === 0) && (
          <div className="text-sm text-gray-400">ยังไม่มีรูปภาพ</div>
        )}
      </div>

      {/* Uploader */}
      <div className="flex justify-center">
        <label className="inline-flex cursor-pointer items-center rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
          <input
            onChange={handleOnChange}
            type="file"
            name="images"
            multiple
            className="hidden"
            accept="image/*"
            disabled={isLoading}
          />
          {isLoading ? "กำลังอัปโหลด…" : "Select Image"}
        </label>
      </div>
    </div>
  );
};

export default Uploadfile;
