import { useState } from "react";

const announcements = [
  "INVITE YOUR CONTENT CREATORS TO VIDEO COMMERCE",
];

export function BrandAnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const repeatedAnnouncements = [...announcements, ...announcements, ...announcements, ...announcements, ...announcements, ...announcements];

  return (
    <div 
      className="relative overflow-hidden py-1.5 bg-gradient-to-r from-[hsl(186,17%,60%)] via-[hsl(120,10%,44%)] to-[hsl(186,17%,60%)]"
      style={{
        transform: "rotate(-1deg) translateX(-2%)",
        width: "104%",
        marginLeft: "-2%",
        marginTop: "-4px",
      }}
      data-testid="banner-brand-announcement"
    >
      <div className="flex animate-brand-marquee whitespace-nowrap">
        {repeatedAnnouncements.map((text, index) => (
          <span 
            key={index} 
            className="mx-8 text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2"
          >
            <span className="text-[hsl(34,67%,70%)]">/</span>
            <span className="text-[hsl(34,67%,70%)]">/</span>
            {text}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes brand-marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-16.66%);
          }
        }
        .animate-brand-marquee {
          animation: brand-marquee 12s linear infinite;
        }
      `}</style>
    </div>
  );
}
