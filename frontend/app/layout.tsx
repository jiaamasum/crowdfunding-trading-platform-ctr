import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Crowdfunding Trading Platform",
    description: "Invest in projects using a share-based model",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`antialiased`}
            >
                {children}
            </body>
        </html>
    );
}
