import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col overflow-x-hidden max-w-full" suppressHydrationWarning>
        <Script
          id="sanitize-extension-attrs"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  function clean(root) {
                    if (!root) return;
                    if (root.removeAttribute && root.hasAttribute && root.hasAttribute('bis_skin_checked')) {
                      root.removeAttribute('bis_skin_checked');
                    }
                    var nodes = root.querySelectorAll ? root.querySelectorAll('[bis_skin_checked]') : [];
                    for (var i = 0; i < nodes.length; i++) {
                      nodes[i].removeAttribute('bis_skin_checked');
                    }
                  }
                  if (typeof document !== 'undefined') {
                    clean(document.documentElement);
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
                              clean(n);
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
                } catch(e) {}
              })();
            `,
          }}
        />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
