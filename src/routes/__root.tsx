import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth/provider";
import { SITE, seoHead } from "@/lib/seo";
import appCss from "@/styles.css?url";

export const Route = createRootRoute({
  head: () => {
    const base = seoHead({
      title: SITE.name,
      description: SITE.description,
      path: "/",
    });
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        ...base.meta,
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        {
          rel: "preconnect",
          href: "https://fonts.googleapis.com",
        },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "anonymous",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap",
        },
        { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
        { rel: "apple-touch-icon", href: "/favicon.svg" },
        { rel: "manifest", href: "/site.webmanifest" },
        ...base.links,
      ],
    };
  },
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang={SITE.lang}>
      <head>
        <HeadContent />
      </head>
      <body>
        <AuthProvider>
          <Outlet />
          <Toaster
            theme="dark"
            position="top-center"
            richColors
            closeButton
            toastOptions={{
              classNames: {
                toast: "bg-bg-elevated border-border text-fg",
              },
            }}
          />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
