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
                About
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="#">History</a>
                </li>
                <li>
                  <a href="#">Our Team</a>
                </li>
                <li>
                  <a href="#">Brand Guidelines</a>
                </li>
                <li>
                  <a href="#">Terms & Condition</a>
                </li>
                <li>
                  <a href="#">Privacy Policy</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-[clamp(1rem,4vw,2rem)] mb-4 font-light">
                Service
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="#">How to order</a>
                </li>
                <li>
                  <a href="#">Our Product</a>
                </li>
                <li>
                  <a href="#">Order status</a>
                </li>
                <li>
                  <a href="#">Promo</a>
                </li>
                <li>
                  <a href="#">Payment Method</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-[clamp(1rem,4vw,2rem)] mb-4 font-light">
                Other
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="#">Contact Us</a>
                </li>
                <li>
                  <a href="#">Help</a>
                </li>
                <li>
                  <a href="#">Privacy</a>
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
