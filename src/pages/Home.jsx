import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar'; 
import Footer from '../components/Footer'; 
import { notificationApi } from '../services/api'; 

// Import your local video file
import backgroundVideo from '../assets/backgroundvideo.mp4';

const Home = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        setIsLoggedIn(!!token);

        if (token && userId) {
            notificationApi.getUnread()
                .then(res => setUnreadCount(res.data.length))
                .catch(err => console.error("Notification Sync Failed", err));
        }
    }, []);

    return (
        <div className="min-h-screen bg-[#FFFDF7] text-[#1A237E] selection:bg-[#FF6D00] selection:text-white font-sans">

            {/* If your Navbar is set to 'absolute' or 'fixed' in its own file, it will float perfectly over the video */}
            <Navbar isLoggedIn={isLoggedIn} unreadNotifications={unreadCount} />

            {/* 
                HERO SECTION - UPDATED FOR FULL EDGE-TO-EDGE PROFESSIONAL LOOK
                Removed the p-6, rounded borders, and margins. Made it h-screen.
            */}
            <header className="relative w-full h-screen min-h-[600px] max-h-[900px] overflow-hidden">
                
                {/* Edge-to-Edge Background Video */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                >
                    <source src={backgroundVideo} type="video/mp4" />
                </video>
                
                {/* 
                    Gradient Overlay: 
                    - Dark at the top so the white Navbar is visible.
                    - Clear in the middle to see the video.
                    - Fades into the exact background color (#FFFDF7) at the bottom for a seamless blend.
                */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#1A237E]/80 via-[#1A237E]/30 to-[#FFFDF7]"></div>

                {/* Content Container - Pushed down to clear the floating Navbar */}
                <div className="relative z-10 flex flex-col justify-center h-full px-6 md:px-12 lg:px-20 pt-24 max-w-screen-2xl mx-auto">
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black uppercase leading-[0.9] tracking-tighter text-white mb-6 drop-shadow-2xl">
                        Incredible <br /> <span className="text-[#FF6D00]">India.</span>
                    </h1>

                    <p className="text-sm sm:text-base md:text-lg font-medium text-white/90 max-w-2xl mb-10 drop-shadow-md">
                        Experience vibrant heritage, book cultural events, and manage your journey through the official tourism portal.
                    </p>

                    <form className="flex flex-col sm:flex-row w-full max-w-2xl bg-white/20 backdrop-blur-md rounded-3xl sm:rounded-full p-1.5 border border-white/30 shadow-2xl gap-2 sm:gap-0">
                        <input
                            type="text"
                            placeholder="Search forts, festivals, states..."
                            className="flex-1 px-5 py-3 sm:px-6 sm:py-4 bg-transparent border-none focus:outline-none text-sm md:text-base text-white placeholder-white/80 font-medium"
                        />
                        <button className="w-full sm:w-auto bg-white text-[#1A237E] px-8 py-3 rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-[#FF6D00] hover:text-white transition-all shadow-lg">
                            Explore
                        </button>
                    </form>
                </div>
            </header>

            {/* MAIN DESTINATIONS GRID */}
            <main className="max-w-screen-2xl mx-auto px-4 md:px-6 py-16 lg:py-24">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none">Featured<br />Destinations</h2>
                    <a href="#" className="inline-flex items-center gap-2 font-bold text-[10px] uppercase tracking-[0.2em] hover:text-[#FF6D00] transition-colors">
                        Explore Map <span className="text-xl">&rarr;</span>
                    </a>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 lg:h-[550px]">
                    {/* Jaipur */}
                    <div className="lg:col-span-4 min-h-[350px] lg:min-h-0 relative rounded-[2.5rem] overflow-hidden group shadow-2xl">
                        <img
                            src="https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&q=80&w=800"
                            alt="Rajasthan"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1A237E]/95 via-transparent flex flex-col justify-end p-10">
                            <span className="bg-[#FF6D00] text-white self-start px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest mb-4">Heritage</span>
                            <h3 className="text-3xl font-black text-white uppercase leading-none tracking-tighter">Jaipur<br />Palaces</h3>
                        </div>
                    </div>

                    {/* Stacked Kerala & Pushkar */}
                    <div className="lg:col-span-4 flex flex-col gap-6 h-full">
                        <div className="flex-1 relative rounded-[2.5rem] overflow-hidden group shadow-xl">
                            <img src="https://www.touracle.in/wp-content/uploads/2025/01/kerala.webp" alt="Kerala" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#004D40]/90 via-transparent flex flex-col justify-end p-8">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Kerala<br />Backwaters</h3>
                            </div>
                        </div>
                        <div className="flex-1 relative rounded-[2.5rem] overflow-hidden group shadow-xl bg-[#880E4F]">
                            <img src="https://production-nuego-cms.blr1.digitaloceanspaces.com/static-contents/prod-v1/The_Spirit_of_Pushkar_Mela_shutterstock_566311246_750_X_450_px_b27b2ae0ab.webp" alt="Pushkar" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-1000" />
                            <div className="absolute inset-0 p-8 flex flex-col justify-center text-white">
                                <span className="text-[8px] font-black uppercase tracking-widest text-[#FF6D00] mb-1">Live Event</span>
                                <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 leading-none">Pushkar<br />Fair</h3>
                                <button className="self-start bg-white text-[#1A237E] font-black uppercase tracking-widest text-[8px] px-6 py-2.5 rounded-full hover:bg-[#FF6D00] hover:text-white transition-all">Book Spot</button>
                            </div>
                        </div>
                    </div>

                    {/* Taj Mahal */}
                    <div className="lg:col-span-4 min-h-[350px] lg:min-h-0 relative rounded-t-[10rem] rounded-b-[2.5rem] overflow-hidden group shadow-2xl">
                        <img src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=800" alt="Taj Mahal" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1A237E]/95 via-transparent flex flex-col justify-end p-10">
                            <span className="bg-white text-[#1A237E] self-start px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest mb-4">Iconic</span>
                            <h3 className="text-3xl font-black text-white uppercase leading-none tracking-tighter">The Taj<br />Mahal</h3>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Home;