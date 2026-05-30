import { withAuth } from "next-auth/middleware";

export default withAuth(
  function proxy() {},
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (!token) {
          return false;
        }
        if (req.nextUrl.pathname.startsWith("/admin")) {
          return token.role === "ADMIN";
        }
        return true;
      },
    },
  },
);

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/cart", "/checkout"],
};
