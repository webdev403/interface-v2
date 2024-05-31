import { AppProps } from 'next/app';
import { SpeedInsights } from '@vercel/speed-insights/next';
import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import Head from 'next/head';
import { PageLayout } from 'layouts';
import Background from 'layouts/Background';
import { mainTheme } from 'styles/theme';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { GoogleAnalytics } from 'nextjs-google-analytics';
import store from 'state';
import ApplicationUpdater from 'state/application/updater';
import TransactionUpdater from 'state/transactions/updater';
import ListsUpdater from 'state/lists/updater';
import UserUpdater from 'state/user/updater';
import MulticallUpdater from 'state/multicall/updater';
import MultiCallV3Updater from 'state/multicall/v3/updater';
import FarmUpdater from 'state/farms/updater';
// import DualFarmUpdater from 'state/dualfarms/updater';
// import CNTFarmUpdater from 'state/cnt/updater';
import SyrupUpdater from 'state/syrups/updater';
import { Web3ReactManager, Popups, TermsWrapper } from 'components';
import { appWithTranslation } from 'next-i18next';
import './index.scss';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Environment, HypeLab, HypeLabContext } from 'hypelab-react';
import { Inter } from 'next/font/google';
import { ArcxAnalyticsProvider } from '@arcxmoney/analytics';

const inter = Inter({ subsets: ['latin'] });

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const theme = mainTheme;

  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
};

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Suspense fallback={<Background fallback={true} />}>
      <ThemeProvider>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </Suspense>
  );
};

function Updaters() {
  return (
    <>
      <ApplicationUpdater />
      <TransactionUpdater />
      <ListsUpdater />
      <MulticallUpdater />
      <MultiCallV3Updater />
      <UserUpdater />
      <FarmUpdater />
      {/* <CNTFarmUpdater /> */}
      {/* <DualFarmUpdater /> */}
      <SyrupUpdater />
    </>
  );
}

const MyApp = ({ Component, pageProps }: AppProps) => {
  const queryClient = new QueryClient();
  const googleAnalyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

  const hypeLabClient = new HypeLab({
    URL: 'https://api.hypelab.com',
    propertySlug: '81c00452a9',
    environment: Environment.Production,
  });

  const arcxAPIKey = process.env.NEXT_PUBLIC_ARCX_KEY ?? '';

  return (
    <>
      <Head>
        <meta charSet='utf-8' />
        <link rel='icon' href='/logo_circle.png' />
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1, minimum-scale=1'
        />
        <meta
          name='description'
          content='QuickSwap is a next-gen #DEX for #DeFi. Trade at lightning-fast speeds with near-zero gas fees.'
        />
        <link rel='apple-touch-icon' href='/logo_circle.png' />
        <title>QuickSwap</title>
      </Head>
      <style jsx global>{`
        html body {
          font-family: ${inter.style.fontFamily};
        }
      `}</style>
      {googleAnalyticsId && (
        <GoogleAnalytics trackPageViews gaMeasurementId={googleAnalyticsId} />
      )}
      <ArcxAnalyticsProvider apiKey={arcxAPIKey}>
        <HypeLabContext client={hypeLabClient}>
          <QueryClientProvider client={queryClient}>
            <Provider store={store}>
              <Providers>
                <TermsWrapper>
                  <Web3ReactManager>
                    <Updaters />
                    <Popups />
                    <PageLayout>
                      <Component {...pageProps} />
                      <SpeedInsights />
                    </PageLayout>
                  </Web3ReactManager>
                </TermsWrapper>
              </Providers>
            </Provider>
          </QueryClientProvider>
        </HypeLabContext>
      </ArcxAnalyticsProvider>
    </>
  );
};

/**MyApp.getInitialProps = async (appContext: any) => {
  const appProps = await App.getInitialProps(appContext);
  return { ...appProps };
};*/

export default appWithTranslation(MyApp);
