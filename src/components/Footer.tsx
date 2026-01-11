import { Link } from "react-router-dom";
import { Ticket, Instagram, Twitter, Youtube, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-gold rounded-lg flex items-center justify-center">
                <Ticket className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-2xl font-bold text-gradient-gold">
                LUXETIX
              </span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Platform tiket konser premium dengan pengalaman eksklusif untuk
              Anda pecinta musik.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold text-foreground mb-4">
              Menu
            </h4>
            <ul className="space-y-2">
              {[
                { name: "Beranda", path: "/" },
                { name: "Konser", path: "/concerts" },
                { name: "Tentang Kami", path: "/about" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display text-lg font-semibold text-foreground mb-4">
              Bantuan
            </h4>
            <ul className="space-y-2">
              {["FAQ", "Cara Pembelian", "Syarat & Ketentuan", "Kebijakan Privasi"].map(
                (item) => (
                  <li key={item}>
                    <span className="text-muted-foreground hover:text-primary transition-colors text-sm cursor-pointer">
                      {item}
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg font-semibold text-foreground mb-4">
              Hubungi Kami
            </h4>
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <Mail className="w-4 h-4" />
              <span className="text-sm">support@luxetix.id</span>
            </div>
            <div className="flex gap-4">
              {[Instagram, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-all"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border/50 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 LUXETIX. All rights reserved.
          </p>
          <div className="flex gap-6">
            <span className="text-sm text-muted-foreground hover:text-primary cursor-pointer">
              Syarat Layanan
            </span>
            <span className="text-sm text-muted-foreground hover:text-primary cursor-pointer">
              Kebijakan Privasi
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
