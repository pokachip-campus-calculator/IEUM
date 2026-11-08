import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ROUTE_META } from "./routes";

/** 화면이 바뀌면 맨 위로 올리고, #앵커가 있으면 그 위치로 이동합니다. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    const timer = window.setInterval(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView();
        window.clearInterval(timer);
      } else if (++tries > 20) {
        window.clearInterval(timer);
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [pathname, hash]);
  return null;
}

/** 화면마다 원본 디자인의 <title> 을 적용합니다. */
function DocumentTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const r = ROUTE_META.find((x) => x.path === pathname);
    document.title = r ? r.title : "이음";
  }, [pathname]);
  return null;
}

/** 모든 화면을 감싸는 껍데기 (스크롤 복원 · 탭 제목) */
export default function App() {
  return (
    <>
      <ScrollManager />
      <DocumentTitle />
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </>
  );
}
