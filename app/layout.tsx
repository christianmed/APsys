import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "APSys",
  description: "Gestión y notificación de pedidos para gráficas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (typeof document !== 'undefined') {
                  new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked') {
                        m.target.removeAttribute('bis_skin_checked');
                      }
                      if (m.type === 'childList') {
                        for (var j = 0; j < m.addedNodes.length; j++) {
                          var n = m.addedNodes[j];
                          if (n.nodeType === 1) {
                            if (n.hasAttribute && n.hasAttribute('bis_skin_checked')) {
                              n.removeAttribute('bis_skin_checked');
                            }
                            var inner = n.querySelectorAll ? n.querySelectorAll('[bis_skin_checked]') : [];
                            for (var k = 0; k < inner.length; k++) {
                              inner[k].removeAttribute('bis_skin_checked');
                            }
                          }
                        }
                      }
                    }
                  }).observe(document.documentElement, {
                    subtree: true,
                    childList: true,
                    attributes: true,
                    attributeFilter: ['bis_skin_checked']
                  });
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
