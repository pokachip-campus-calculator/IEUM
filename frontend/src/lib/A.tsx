import type { AnchorHTMLAttributes } from "react";
import { Link } from "react-router-dom";

/**
 * 원본 디자인의 <a> 를 그대로 옮긴 링크.
 * href 가 앱 내부 경로('/home' 등)면 React Router 로 이동하고, 그 밖(외부 주소·#·tel:)은 일반 <a> 로 둡니다.
 */
export function A({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href && href.startsWith("/") && !rest.target) {
    return (
      <Link to={href} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
