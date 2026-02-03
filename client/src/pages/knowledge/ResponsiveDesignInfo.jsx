import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ResponsiveDesignInfo = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 font-poppins font-light text-gray-800">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-medium text-gray-900">Knowledge Base</h1>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-12">

                {/* Intro Section */}
                <section className="space-y-6">
                    <h2 className="text-3xl md:text-4xl font-normal text-[#193C6C]">
                        ในการออกแบบ Software ต่าง ๆ นั้น...
                    </h2>
                    <p className="text-lg leading-relaxed text-gray-600">
                        หากเป็นการออกแบบที่เจาะจงในเฉพาะ Device (อุปกรณ์) หรือเฉพาะทางมาก ๆ นั้น การออกแบบจะต้องอ้างอิงจากขนาดหน้าจอของ Device ที่ผู้ใช้งานส่วนใหญ่ใช้จริง ๆ ตามหน้างานหรือเฉพาะธุรกิจและอุตสาหกรรมนั้น
                    </p>
                    <p className="text-lg leading-relaxed text-gray-600">
                        แต่เนื่องจากปัจจุบันนี้การใช้งานของผู้คนทั่วไปนั้น จะใช้ Device ที่แตกต่างและหลากหลายขนาด การออกแบบหน้าจอการใช้งานแบบ Responsive Design จึงเป็นทางออกที่นิยมนำมาใช้ เพื่อปรับแก้ปัญหาความแตกต่างของหน้าจอในปัจจุบันให้มีศักยภาพในการใช้งานมากขึ้น
                    </p>
                </section>

                {/* What is Responsive Design */}
                <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="text-2xl font-medium text-[#193C6C]">Responsive Design คืออะไร</h3>
                    <p className="text-gray-600 leading-relaxed">
                        Responsive Design คือการออกแบบหน้าตาของการแสดงผลให้สอดคล้องกับหน้าจอของผู้ใช้งานที่หลากหลายในปัจจุบัน สามารถแสดงผลได้อย่างมีประสิทธิภาพมากที่สุด ไม่ว่าจะเป็นการออกแบบในระบบใดก็ตามในการออกแบบเพียงแค่ครั้งเดียว ซึ่งเราไม่สามารถคาดเดาได้เลยว่า ณ เวลาที่เราให้บริการระบบนั้น ลูกค้าหรือผู้ใช้งานที่เข้ามาใช้จะเข้ามาด้วย Device ใด ขนาดหน้าจอเท่าไร การออกแบบ Responsive จึงจะช่วยในการรองรับการแสดงผลของหน้าจอที่หลากหลาย สามารถทำงานได้อย่างมีประสิทธิภาพมากขึ้น
                    </p>
                </section>

                {/* Responsive vs Adaptive */}
                <section className="space-y-6">
                    <h3 className="text-2xl font-medium text-[#193C6C]">ความแตกต่างของ Responsive กับ Adaptive Design</h3>
                    <p className="text-gray-600 leading-relaxed">
                        ความแตกต่างระหว่าง Responsive Design กับ Adaptive Design นั้นค่อนข้างชัดเจนคือการออกแบบ Adaptive Design นั้นเป็นการออกแบบรูปแบบการแสดงผลแบบหลาย ๆ โครงสร้างเพื่อเลือกที่จะนำมาแสดงผลในหน้าจอที่ต่างกัน ส่วน Responsive Design คือการออกแบบลักษณะโครงสร้างหลักเพียงครั้งเดียว และการแสดงผลจะสามารถปรับเปลี่ยนไปตามขนาดของหน้าจอได้ด้วยตัวของมันเอง
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 my-8">
                        <div className="bg-blue-50 p-6 rounded-xl">
                            <h4 className="font-medium text-[#193C6C] mb-2">Responsive Design</h4>
                            <p className="text-sm text-gray-600">ใช้ต้นทุนและเวลาในการพัฒนาน้อยกว่า เนื่องจากออกแบบเพียงครั้งเดียว</p>
                        </div>
                        <div className="bg-indigo-50 p-6 rounded-xl">
                            <h4 className="font-medium text-[#193C6C] mb-2">Adaptive Design</h4>
                            <p className="text-sm text-gray-600">ออกแบบหลายหน้าจอตามอุปกรณ์ มอบประสบการณ์ที่ดีที่สุดแต่ต้นทุนสูงกว่า</p>
                        </div>
                    </div>

                    <p className="text-gray-600 leading-relaxed">
                        แต่ด้วยปัจจุบันผู้ใช้งานใช้ Device ที่แตกต่างกันมาก แม้แต่โทรศัพท์มือถือก็ยังมีขนาดที่แตกต่างกัน หลากหลายรูปแบบตามที่วางขายกันในท้องตลาดปัจจุบัน ดังนั้นการออกแบบ Responsive Design จึงเป็นที่นิยมมากกว่าที่จะใช้แบบ Adaptive Design แต่ก็ไม่ได้หมายความว่า จะไม่มีใครที่พัฒนาระบบด้วย Adaptive Design เลย ทั้งนี้ทั้งนั้นก็ขึ้นอยู่กับความคุ้มค่ากับผลที่จะได้มาจากการพัฒนาระบบออกมานั่นเอง
                    </p>
                </section>

                {/* Screen Sizes */}
                <section className="space-y-8">
                    <h3 className="text-2xl font-medium text-[#193C6C]">ขนาดหน้าจอใช้งานทั่วไปในปัจจุบัน</h3>
                    <p className="text-gray-600 leading-relaxed">
                        ขนาดของหน้าจอปัจจุบันนั้นจะแบ่งได้ตาม Device หลัก ๆ 3 รูปแบบ ที่ผู้ใช้ทั่วไปใช้งาน คือ Desktop, Tablet และ Mobile ซึ่งมีข้อมูลการสรุปขนาดหน้าจอต่าง ๆ ดังนี้
                    </p>

                    <div className="space-y-6 my-8">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <img
                                src="/img/knowledge/mobile_tablet_stats.png"
                                alt="Mobile and Tablet Screen Stats"
                                className="w-full h-auto object-contain rounded-lg"
                            />
                            <p className="text-center text-sm text-gray-500 mt-2">สถิติขนาดหน้าจอ Mobile และ Tablet</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <img
                                src="/img/knowledge/desktop_stats.png"
                                alt="Desktop Screen Stats"
                                className="w-full h-auto object-contain rounded-lg"
                            />
                            <p className="text-center text-sm text-gray-500 mt-2">สถิติขนาดหน้าจอ Desktop</p>
                        </div>
                    </div>

                    <p className="text-gray-600 leading-relaxed">
                        จากสถิติเบื้องต้นจะเห็นว่าการเข้าใช้งานด้วย Mobile มีจำนวนมากที่สุด ตามมาด้วย Desktop และน้อยสุดที่ Tablet ซึ่งแต่ละ Device ก็จะมีความแตกต่างของขนาดหน้าจอกันไปอีกหลายขนาด
                    </p>
                </section>

                {/* Design Guidelines */}
                <section className="bg-gray-100 p-6 md:p-8 rounded-2xl space-y-6">
                    <h3 className="text-2xl font-medium text-[#193C6C]">แนวทางที่ดีที่สุดในการเลือกขนาดหน้าจอในการออกแบบ</h3>

                    <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-800">1. เข้าใจรูปแบบการใช้งานบนหน้าจอ</h4>
                        <p className="text-gray-600">
                            ต้องเข้าใจก่อนว่าระบบนั้นอยู่ในธุรกิจใด คู่แข่งคือใคร พฤติกรรมการใช้งานของลูกค้าเป็นอย่างไร เพื่อตีกรอบ Device หลักและออกแบบให้รองรับการใช้งานให้ได้มากที่สุด
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-800">2. ออกแบบ Padding เผื่อหน้าจอที่เล็กกว่า 1 ไซซ์</h4>
                        <p className="text-gray-600">
                            การวาง Padding ให้กว้าง และลด Space ตรงกลางลงมาเล็กน้อยเพื่อให้หน้าจอที่เล็กกว่าการออกแบบ สามารถแสดงผลได้ด้วย
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-800">3. ความคุ้มค่าในการพัฒนา</h4>
                        <p className="text-gray-600">
                            บางครั้งการรองรับขนาดหน้าจอที่คนส่วนใหญ่ใช้เพียงขนาดเดียวแล้วพัฒนาเพิ่มใน Phase ถัดไป อาจคุ้มค่ากว่าการลงทุนรองรับทุก Device ในครั้งเดียว
                        </p>
                    </div>
                </section>

            </div>
        </div>
    );
};

export default ResponsiveDesignInfo;
