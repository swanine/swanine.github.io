import Link from "./Link";
import HomeLink from "./HomeLink";
import { serif } from "./fonts";
import "./global.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={serif.className}>
      <body className="mx-auto max-w-2xl bg-[--bg] px-5 py-12 text-[--text]">
        <header className="mb-14 flex flex-row place-content-between">
          <HomeLink />
          <span className="relative top-[4px] italic">
            by{" "}
            <Link href="https://swanine.com" target="_blank">
              <img
                alt="Swanine"
                src="https://avatars.githubusercontent.com/u/52339771?v=4"
                className="relative -top-1 mx-1 inline h-8 w-8 rounded-full"
              />
            </Link>
          </span>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
