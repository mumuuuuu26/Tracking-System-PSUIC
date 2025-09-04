import React from "react";

const Item = ({ h, p }) => (
  <div className="text-center border-[10px] border-[#333] py-24 mt-12">
    <h3 className="uppercase text-[clamp(2rem,8vw,4rem)]">{h}</h3>
    <p className="text-[clamp(1.25rem,5vw,2rem)] font-bold">{p}</p>
  </div>
);

const StatsSection = () => {
  return (
    <section className="bg-[#f0f3f2] py-16">
      <div className="mx-auto max-w-screen-2xl px-4">
        <div className="grid gap-20 md:grid-cols-3">
          <Item h="2k+" p="customer" />
          <Item h="2" p="store" />
          <Item h="22+" p="years experience" />
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
