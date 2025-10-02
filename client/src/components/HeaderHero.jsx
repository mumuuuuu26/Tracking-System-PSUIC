import React from "react";
import { Link } from "react-router-dom";
import bannerBg from "../assets/palm2.jpg";

const HeaderHero = () => {
  return (
    <div
      className="min-h-[800px] bg-center bg-cover flex items-center"
      style={{ backgroundImage: `url(${bannerBg})` }}
    >
      <div className="mx-auto max-w-screen-2xl px-4 w-full">
        <div className="text-white text-center flex justify-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="uppercase text-[clamp(2rem,10vw,6rem)] font-bold leading-tight">
              Banklang Palm ©
            </h1>

            <Link
              to="/login"
              className="inline-block mx-auto rounded-full bg-gradient-to-r from-emerald-500 to-green-600 
             px-8 py-3 text-center font-semibold text-white shadow-lg transform transition 
             duration-300 hover:scale-105 hover:shadow-emerald-500/50"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderHero;
