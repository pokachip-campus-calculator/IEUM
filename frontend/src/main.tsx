import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
// 공통 디자인 시스템 스타일(ie-* 클래스)은 모든 화면이 함께 씁니다.
import "@/styles/ie.css";
import "@/styles/base.css";
import { router } from "./router";

// 화면 로직(클래스 컴포넌트)이 원본 디자인과 같은 타이밍으로 동작하도록 StrictMode 는 쓰지 않았어요.
createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
