import { Html, Head, Main, NextScript } from "next/document";

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function Document() {
  const meta = {
    description: "위스키 리뷰 검색 & 작성 사이트",
    title: "위스키 리뷰 검색/작성기",
    url: "https://whiskeygallery-review.com",
    image: "/favicon.ico",
  };

  return (
    <Html lang="ko">
      <Head>
        <meta property="og:type" content="website" />

        <meta name="mobile-web-app-capable" content="yes" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-touch-fullscreen" content="yes" />

        <meta name="msapplication-navbutton-color" content="#755139" />
        <meta name="msapplication-TileColor" content="#755139" />
        <meta name="msapplication-starturl" content="/" />
        <meta name="msapplication-tap-highlight" content="no" />

        <meta name="full-screen" content="yes" />
        <meta name="browsermode" content="application" />

        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />

        <meta name="theme-color" content="#755139" key="themeColor" />
        <link rel="canonical" href={meta.url} />

        <meta property="og:title" content={meta.title} key="og_title" />
        <meta
          property="og:description"
          content={meta.description}
          key="og_description"
        />
        <meta property="og:site_name" content={meta.title} key="og_site_name" />
        <meta property="og:url" content={meta.url} key="og_url" />

        <meta name="twitter:title" content={meta.title} key="twt_title" />
        <meta
          name="twitter:description"
          content={meta.description}
          key="twt_description"
        />
        <meta name="twitter:url" content={meta.url} key="twt_url" />

        <meta
          name="apple-mobile-web-app-title"
          content={meta.title}
          key="apple_mobile_title"
        />

        <meta
          name="application-name"
          content={meta.title}
          key="application_name"
        />

        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
