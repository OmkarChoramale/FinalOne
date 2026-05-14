import React from 'react';

const Footer = () => (
  <div className="px-4 md:px-6 pb-6 mt-auto">
    <footer className="max-w-screen-2xl mx-auto bg-[#1A237E] text-white rounded-[2rem] py-6 px-6 md:px-10 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
      <div className="text-2xl md:text-3xl font-black uppercase tracking-tighter flex items-center gap-2">
        <span className="w-4 h-4 rounded-full bg-[#FF6D00]"></span>
        TourismGov
      </div>
      <div className="flex flex-wrap justify-center gap-4 md:gap-6 font-bold text-[10px] md:text-xs uppercase tracking-widest opacity-80">
        <a href="#" className="hover:text-[#FF6D00] transition-colors">Privacy</a>
        <a href="#" className="hover:text-[#FF6D00] transition-colors">Terms</a>
        <a href="#" className="hover:text-[#FF6D00] transition-colors">Accessibility</a>
      </div>
    </footer>
  </div>
);

export default Footer;