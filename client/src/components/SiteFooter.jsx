import React from "react";
import greenBg from "../assets/Green.png";
const SiteFooter = () => {
  return (
    <footer
      className="min-h-[800px] bg-center bg-cover"
      style={{ backgroundImage: `url(${greenBg})` }}
    >
      <div className="mx-auto max-w-screen-2xl px-4">
        <div className="min-h-[800px] flex items-center">
          <div className="grid w-full gap-12 sm:grid-cols-2 lg:grid-cols-4 text-[#333]">
            <div>
              <h4 className="text-[clamp(1rem,4vw,2rem)] mb-4 font-light">
                Banklang Palm
              </h4>
              <p>93/1 ม.3 ต.บ้านกลาง อ.อ่าวลึก จ.กระบี่ 81110</p>
              <ul className="flex gap-4 mt-4">
                <li>
                  <a href="#">
                    <i className="fab fa-instagram" />
                  </a>
                </li>
                <li>
                  <a href="#">
                    <i className="fab fa-facebook" />
                  </a>
                </li>
                <li>
                  <a href="#">
                    <i className="fab fa-twitter" />
                  </a>
                </li>
                <li>
                  <a href="#">
                    <i className="fas fa-phone-alt" />
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-[clamp(1rem,4vw,2rem)] mb-4 font-light">
                เกี่ยวกับเรา
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="#">ประวัติบ้านกลางปาล์ม</a>
                </li>
                <li>
                  <a href="#">ทีมงานของเรา</a>
                </li>
                <li>
                  <a href="#">แนวทางการใช้</a>
                </li>
                <li>
                  <a href="#">ข้อกำหนดและเงื่อนไข</a>
                </li>
                <li>
                  <a href="#">นโยบายความเป็นส่วนตัว</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-[clamp(1rem,4vw,2rem)] mb-4 font-light">
                บริการของเรา
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="#">วิธีการใช้งาน</a>
                </li>
                <li>
                  <a href="#">สินค้าของเรา</a>
                </li>
                <li>
                  <a href="#">ติดตามคำสั่งซื้อ</a>
                </li>
                <li>
                  <a href="#">โปรโมชั่น</a>
                </li>
                <li>
                  <a href="#">วิธีการชำระเงิน</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-[clamp(1rem,4vw,2rem)] mb-4 font-light">
                อื่นๆ
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="#">ติดต่อเรา</a>
                </li>
                <li>
                  <a href="#">ศูนย์ช่วยเหลือ</a>
                </li>
                <li>
                  <a href="#">ความเป็นส่วนตัว</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
