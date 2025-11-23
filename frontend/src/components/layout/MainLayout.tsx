import { ReactNode } from 'react';
import Head from 'next/head';

type MainLayoutProps = {
    children: ReactNode;
    title?: string;
    description?: string;
};

export default function MainLayout({
    children,
    title = 'TravelYaari - Your Journey Begins Here',
    description = 'Discover amazing travel destinations and plan your next adventure with TravelYaari.'
}: MainLayoutProps) {
    return (
        <>
            <Head>
                <title>{title}</title>
                <meta name="description" content={description} />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <div className="flex min-h-screen flex-col bg-gray-50">
                {/* Header would go here */}
                {/* <Header /> */}

                <main className="flex-1">
                    {children}
                </main>

                {/* Footer would go here */}
                {/* <Footer /> */}
            </div>
        </>
    );
}
