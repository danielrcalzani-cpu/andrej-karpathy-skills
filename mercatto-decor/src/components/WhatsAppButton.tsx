import { WhatsAppIcon } from "./Icons";
import { whatsappUrl } from "@/lib/whatsapp";

export default function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a Mercatto Decor no WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex h-14 items-center gap-3 rounded-full bg-[#1f8f4e] pl-4 pr-4 text-white shadow-[0_12px_30px_-8px_rgba(0,0,0,0.45)] transition-[padding,background-color] duration-500 hover:bg-[#187a42] md:bottom-8 md:right-8 md:hover:pr-6"
    >
      <WhatsAppIcon className="h-6 w-6" />
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-[max-width] duration-500 group-hover:max-w-48 md:inline">
        Falar no WhatsApp
      </span>
    </a>
  );
}
